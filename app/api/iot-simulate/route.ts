import { NextResponse } from "next/server";

import { applyIotReading } from "@/lib/iot/apply-reading";
import { getIotSimulationSeed, isIotSimulationEnabled } from "@/lib/iot/simulator-config";
import {
  createSimulationRng,
  nextSimulatedFillLevel,
  shouldIncludeBin,
  type BinTelemetryRow,
} from "@/lib/iot/simulator";
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

  if (!isIotSimulationEnabled()) {
    return NextResponse.json({ skipped: true, reason: "IOT_SIMULATION_ENABLED is not true" });
  }

  const supabase = createServiceRoleClient();
  const rng = createSimulationRng(getIotSimulationSeed());

  const { data: bins, error } = await supabase.from("bins").select("id, fill_level, status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = (bins ?? []) as BinTelemetryRow[];
  const totalBins = rows.length;

  let simulated = 0;
  let alertsTriggered = 0;
  const samples: { bin_id: string; from: number; to: number }[] = [];

  for (const bin of rows) {
    if (!shouldIncludeBin(bin, rng, totalBins)) continue;

    const from = bin.fill_level;
    const to = nextSimulatedFillLevel(bin, rng);

    if (to === from && bin.status !== "collected") continue;

    const result = await applyIotReading(supabase, { bin_id: bin.id, fill_level: to });

    if (!result.success) continue;

    simulated += 1;
    if (result.alert_triggered) alertsTriggered += 1;

    if (samples.length < 5) {
      samples.push({ bin_id: bin.id, from, to });
    }
  }

  return NextResponse.json({
    simulated,
    alerts_triggered: alertsTriggered,
    total_bins: totalBins,
    samples,
  });
}
