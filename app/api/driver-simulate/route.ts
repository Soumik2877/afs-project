import { NextResponse } from "next/server";

import { anomalyDemoPosition, type DriverPosition } from "@/lib/simulation/driver-movement";
import {
  getDriverSimulationStepMeters,
  isDriverAnomalyDemoEnabled,
  isDriverSimulationEnabled,
} from "@/lib/simulation/config";
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

  const { data: routes, error: routesError } = await supabase
    .from("routes")
    .select("id, assigned_driver_id, bin_ids, status")
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

    const collectedBinIds = new Set((pickups ?? []).map((row) => row.bin_id as string));

    const { data: existing } = await supabase
      .from("driver_locations")
      .select("latitude, longitude, updated_at")
      .eq("driver_id", driverId)
      .maybeSingle();

    let position: DriverPosition;
    let collectedThisTick: string[] = [];

    if (anomalyDemo && updated % 2 === 0) {
      position = anomalyDemoPosition(orderedBins);
    } else {
      const current = existing
        ? ({
            latitude: existing.latitude as number,
            longitude: existing.longitude as number,
            updated_at: existing.updated_at as string,
          } satisfies DriverPosition)
        : null;

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

      if (tick.routeComplete) {
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
