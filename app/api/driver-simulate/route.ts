import { NextResponse } from "next/server";

import { anomalyDemoPosition, type DriverPosition } from "@/lib/simulation/driver-movement";
import {
  getDriverSimulationStepMeters,
  isDriverAnomalyDemoEnabled,
  isDriverSimulationEnabled,
} from "@/lib/simulation/config";
import {
  ensureDemoRouteActive,
  isDemoLoopRoute,
  resetDemoRouteLap,
} from "@/lib/simulation/demo-loop";
import { simulateCitizenDetourTick } from "@/lib/simulation/citizen-detour";
import { simulateRouteTick, type RouteBinWaypoint } from "@/lib/simulation/route-collection";
import { createServiceRoleClient } from "@/lib/supabase/service";

function authorize(request: Request) {
  const header = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (header === `Bearer ${secret}`) return true;
  try {
    const url = new URL(request.url);
    return url.searchParams.get("secret") === secret;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  return runSimulation(request);
}

export async function GET(request: Request) {
  return runSimulation(request);
}

async function runSimulation(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDriverSimulationEnabled()) {
    return NextResponse.json({
      skipped: true,
      reason: "DRIVER_SIMULATION_ENABLED is not true",
    });
  }

  const supabase = createServiceRoleClient();
  const stepMeters = getDriverSimulationStepMeters();
  const anomalyDemo = isDriverAnomalyDemoEnabled();

  await ensureDemoRouteActive(supabase);

  const { data: routes, error: routesError } = await supabase
    .from("routes")
    .select("id, name, assigned_driver_id, bin_ids, status")
    .eq("status", "active");

  if (routesError) {
    return NextResponse.json({ error: routesError.message }, { status: 400 });
  }

  let updated = 0;
  let binsCollected = 0;
  const samples: {
    driver_id: string;
    route_id: string;
    lat: number;
    lng: number;
    collected: string[];
  }[] = [];

  for (const route of routes ?? []) {
    const driverId = route.assigned_driver_id as string | null;
    const binIds = (route.bin_ids as string[] | null)?.filter(Boolean) ?? [];

    if (!driverId || !binIds.length) continue;

    const { data: binsData } = await supabase
      .from("bins")
      .select("id, latitude, longitude")
      .in("id", binIds);

    const binMap = new Map((binsData ?? []).map((bin) => [bin.id as string, bin]));

    const orderedBins: RouteBinWaypoint[] = binIds
      .map((id) => {
        const row = binMap.get(id);
        if (!row) return null;
        return {
          id,
          latitude: row.latitude as number,
          longitude: row.longitude as number,
        };
      })
      .filter(Boolean) as RouteBinWaypoint[];

    if (!orderedBins.length) continue;

    const { data: pickups } = await supabase
      .from("pickups")
      .select("bin_id")
      .eq("route_id", route.id as string)
      .eq("driver_id", driverId);

    let collectedBinIds = new Set((pickups ?? []).map((row) => row.bin_id as string));
    const demoLoop = isDemoLoopRoute(route.name as string);

    if (demoLoop && collectedBinIds.size >= orderedBins.length) {
      await resetDemoRouteLap(supabase, route.id as string, driverId, binIds);
      collectedBinIds = new Set();
    }

    const { data: existing } = await supabase
      .from("driver_locations")
      .select("latitude, longitude, updated_at")
      .eq("driver_id", driverId)
      .maybeSingle();

    let position: DriverPosition;
    let collectedThisTick: string[] = [];

    const current = existing
      ? ({
          latitude: existing.latitude as number,
          longitude: existing.longitude as number,
          updated_at: existing.updated_at as string,
        } satisfies DriverPosition)
      : null;

    const { data: citizenPickup } = await supabase
      .from("citizen_pickup_requests")
      .select("id, latitude, longitude, status")
      .eq("route_id", route.id as string)
      .in("status", ["pending", "en_route", "arrived"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (anomalyDemo && updated % 2 === 0) {
      position = anomalyDemoPosition(orderedBins);
    } else if (citizenPickup) {
      if (citizenPickup.status === "arrived") {
        position = current ?? {
          latitude: citizenPickup.latitude as number,
          longitude: citizenPickup.longitude as number,
          updated_at: new Date().toISOString(),
        };
      } else {
        const detour = simulateCitizenDetourTick(
          current,
          {
            latitude: citizenPickup.latitude as number,
            longitude: citizenPickup.longitude as number,
          },
          stepMeters,
        );

        position = detour.position;

        if (detour.arrived) {
          await supabase
            .from("citizen_pickup_requests")
            .update({ status: "arrived", arrived_at: new Date().toISOString() })
            .eq("id", citizenPickup.id as string);
        } else if (citizenPickup.status === "pending") {
          await supabase
            .from("citizen_pickup_requests")
            .update({ status: "en_route" })
            .eq("id", citizenPickup.id as string);
        }
      }
    } else {
      const tick = simulateRouteTick({
        driverId,
        routeId: route.id as string,
        orderedBins,
        collectedBinIds,
        current,
        stepMeters,
      });

      position = tick.position;
      collectedThisTick = tick.collectedThisTick;

      for (const binId of collectedThisTick) {
        const waypoint = orderedBins.find((bin) => bin.id === binId);

        if (!collectedBinIds.has(binId)) {
          await supabase.from("pickups").insert({
            route_id: route.id as string,
            bin_id: binId,
            driver_id: driverId,
            driver_latitude: waypoint?.latitude ?? position.latitude,
            driver_longitude: waypoint?.longitude ?? position.longitude,
          });
        }

        await supabase
          .from("bins")
          .update({
            status: "empty",
            fill_level: 0,
            last_updated: new Date().toISOString(),
          })
          .eq("id", binId);

        binsCollected += 1;
      }

      if (tick.routeComplete && demoLoop) {
        await resetDemoRouteLap(supabase, route.id as string, driverId, binIds);
      } else if (tick.routeComplete) {
        await supabase.from("routes").update({ status: "completed" }).eq("id", route.id as string);
      }
    }

    const { error: upsertError } = await supabase.from("driver_locations").upsert(
      {
        driver_id: driverId,
        route_id: route.id as string,
        latitude: position.latitude,
        longitude: position.longitude,
        updated_at: position.updated_at,
      },
      { onConflict: "driver_id" },
    );

    if (upsertError) continue;

    updated += 1;

    if (samples.length < 5) {
      samples.push({
        driver_id: driverId,
        route_id: route.id as string,
        lat: position.latitude,
        lng: position.longitude,
        collected: collectedThisTick,
      });
    }
  }

  return NextResponse.json({
    updated,
    bins_collected: binsCollected,
    active_routes: routes?.length ?? 0,
    anomaly_demo: anomalyDemo,
    samples,
  });
}
