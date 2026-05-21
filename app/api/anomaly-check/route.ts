import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/service";
import { evaluateDriverAnomaly, type BinCoord, type DriverSnapshot } from "@/lib/utils/anomaly";

function authorize(request: Request) {
  const bearer = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (bearer === `Bearer ${secret}`) return true;
  try {
    const url = new URL(request.url);
    return url.searchParams.get("secret") === secret;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: routes } = await supabase.from("routes").select("*").eq("status", "active");

  const { data: locations } = await supabase.from("driver_locations").select("*");

  let latestAnomaly: {
    id: string;
    reason: string;
    acknowledged: boolean;
    created_at: string;
  } | null = null;

  for (const route of routes ?? []) {
    const driverId = route.assigned_driver_id as string | null;

    if (!driverId) continue;

    const loc = locations?.find((entry) => entry.driver_id === driverId && entry.route_id === route.id);

    if (!loc) continue;

    const binIds = (route.bin_ids as string[] | null)?.filter(Boolean) ?? [];

    if (!binIds.length) continue;

    const { data: binsData } = await supabase.from("bins").select("id, latitude, longitude").in("id", binIds);

    const coords = (binsData ?? []) as BinCoord[];

    const snapshot: DriverSnapshot = {
      driverId,
      routeId: route.id as string,
      latitude: loc.latitude,
      longitude: loc.longitude,
      updatedAtIso: loc.updated_at as string,
    };

    const reason = evaluateDriverAnomaly(snapshot, coords);

    if (!reason) continue;

    const duplicate = await supabase
      .from("anomaly_alerts")
      .select("id")
      .eq("driver_id", driverId)
      .eq("route_id", route.id)
      .eq("acknowledged", false)
      .maybeSingle();

    if (duplicate.data?.id) continue;

    const inserted = await supabase
      .from("anomaly_alerts")
      .insert({
        driver_id: driverId,
        route_id: route.id as string,
        reason,
        severity: "warning",
      })
      .select("id, created_at, reason, acknowledged")
      .single();

    if (inserted.data) {
      latestAnomaly = {
        id: inserted.data.id,
        reason: inserted.data.reason as string,
        acknowledged: inserted.data.acknowledged as boolean,
        created_at: inserted.data.created_at as string,
      };
    }
  }

  return NextResponse.json({
    processed: routes?.length ?? 0,
    anomaly: latestAnomaly,
  });
}
