import { NextResponse } from "next/server";

import { getDemoRouteName } from "@/lib/simulation/demo-loop";
import { citizenPickupRequestSchema } from "@/lib/validations/citizen-pickup";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = citizenPickupRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "citizen") {
    return NextResponse.json({ error: "Only citizens can request pickup" }, { status: 403 });
  }

  let routeId = parsed.data.route_id;

  if (!routeId) {
    const { data: route } = await supabase
      .from("routes")
      .select("id")
      .eq("name", getDemoRouteName())
      .eq("status", "active")
      .order("shift_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    routeId = route?.id;
  }

  if (!routeId) {
    return NextResponse.json({ error: "No active collection route" }, { status: 404 });
  }

  await supabase
    .from("citizen_pickup_requests")
    .update({ status: "cancelled" })
    .eq("citizen_id", user.id)
    .in("status", ["pending", "en_route", "arrived"]);

  const { data, error } = await supabase
    .from("citizen_pickup_requests")
    .insert({
      citizen_id: user.id,
      route_id: routeId,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    const status = error.code === "PGRST205" ? 503 : 400;
    const message =
      error.code === "PGRST205"
        ? "citizen_pickup_requests table is missing. Run migration 000002 in Supabase SQL Editor or npm run db:migrate:citizen-pickup."
        : error.message;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ request: data });
}
