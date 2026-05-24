import { NextResponse } from "next/server";

import { citizenPickupConfirmSchema } from "@/lib/validations/citizen-pickup";
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
  const parsed = citizenPickupConfirmSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("citizen_pickup_requests")
    .select("*")
    .eq("id", parsed.data.request_id)
    .eq("citizen_id", user.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Pickup request not found" }, { status: 404 });
  }

  if (existing.status !== "arrived") {
    return NextResponse.json(
      { error: "Truck has not arrived yet. Wait for the arrival alert." },
      { status: 409 },
    );
  }

  const { data, error } = await supabase
    .from("citizen_pickup_requests")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.request_id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: userRow } = await supabase.from("users").select("eco_points").eq("id", user.id).maybeSingle();

  if (userRow) {
    await supabase
      .from("users")
      .update({ eco_points: (userRow.eco_points ?? 0) + 15 })
      .eq("id", user.id);
  }

  return NextResponse.json({ request: data });
}
