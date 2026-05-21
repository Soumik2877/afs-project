import { NextResponse } from "next/server";

import { applyIotReading } from "@/lib/iot/apply-reading";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { iotPingSchema } from "@/lib/validations/schemas";

function authorize(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const iotHeader = request.headers.get("x-iot-secret") ?? "";
  const secret = process.env.CRON_SECRET ?? process.env.IOT_WEBHOOK_SECRET;

  if (!secret) return false;

  if (header === `Bearer ${secret}`) return true;
  if (iotHeader === secret) return true;

  return false;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = iotPingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const result = await applyIotReading(supabase, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Update failed" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    alert_triggered: result.alert_triggered,
  });
}
