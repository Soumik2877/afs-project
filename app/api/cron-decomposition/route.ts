import { NextResponse } from "next/server";

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
  return runJob(request);
}

export async function GET(request: Request) {
  return runJob(request);
}

async function runJob(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("decomposition_batches")
    .select("id, notified, batch_label")
    .eq("status", "decomposing")
    .lte("estimated_ready_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const ids = (due ?? []).map((row) => row.id);

  if (ids.length === 0) {
    return NextResponse.json({ promoted: 0 });
  }

  await supabase.from("decomposition_batches").update({ status: "ready", notified: true }).in("id", ids);

  return NextResponse.json({
    promoted: ids.length,
    batches: due,
  });
}
