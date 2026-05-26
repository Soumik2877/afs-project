import { NextResponse } from "next/server";

import { snapDriverToRoute } from "@/lib/citizen-pickup/snap-driver-to-route";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: active, error: fetchError } = await supabase
    .from("citizen_pickup_requests")
    .select("id, route_id, status")
    .eq("citizen_id", user.id)
    .in("status", ["pending", "en_route", "arrived"]);

  if (fetchError) {
    const status = fetchError.code === "PGRST205" ? 503 : 400;
    return NextResponse.json({ error: fetchError.message }, { status });
  }

  if (!active?.length) {
    return NextResponse.json({ error: "No active pickup to cancel" }, { status: 404 });
  }

  const ids = active.map((row) => row.id as string);
  const routeId = active[0]!.route_id as string;

  const { error: cancelError } = await supabase
    .from("citizen_pickup_requests")
    .update({ status: "cancelled" })
    .in("id", ids);

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message }, { status: 400 });
  }

  const { data: route } = await supabase
    .from("routes")
    .select("assigned_driver_id")
    .eq("id", routeId)
    .maybeSingle();

  const driverId = route?.assigned_driver_id as string | undefined;
  let driverLocation = null;

  if (driverId) {
    const service = createServiceRoleClient();
    driverLocation = await snapDriverToRoute(service, routeId, driverId);
  }

  return NextResponse.json({
    cancelled: ids.length,
    driver_location: driverLocation,
  });
}
