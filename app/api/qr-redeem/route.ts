import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { pointsForBagType } from "@/lib/utils/eco-points";

export async function POST(request: Request) {
  const payload = await request.json();
  const code = payload?.code as string | undefined;

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "driver") {
    return NextResponse.json({ error: "Drivers only" }, { status: 403 });
  }

  const service = createServiceRoleClient();

  const { data: token, error: tokenError } = await service.from("qr_codes").select("*").eq("code_string", code).maybeSingle();

  if (tokenError || !token) {
    return NextResponse.json({ error: "QR not found" }, { status: 404 });
  }

  if (token.scanned_at) {
    return NextResponse.json({ error: "Already scanned" }, { status: 409 });
  }

  const award = pointsForBagType(token.bag_type);

  const { data: citizen } = await service.from("users").select("eco_points, full_name").eq("id", token.citizen_id).maybeSingle();

  const nextBalance = (citizen?.eco_points ?? 0) + award;

  const updateCitizen = await service.from("users").update({ eco_points: nextBalance }).eq("id", token.citizen_id);

  if (updateCitizen.error) {
    return NextResponse.json({ error: updateCitizen.error.message }, { status: 400 });
  }

  const finalize = await service
    .from("qr_codes")
    .update({
      scanned_at: new Date().toISOString(),
      scanned_by_driver_id: user.id,
      eco_points_awarded: award,
    })
    .eq("id", token.id);

  if (finalize.error) {
    return NextResponse.json({ error: finalize.error.message }, { status: 400 });
  }

  return NextResponse.json({
    citizenName: citizen?.full_name ?? "Citizen",
    points: award,
  });
}
