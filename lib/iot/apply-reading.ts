import type { SupabaseClient } from "@supabase/supabase-js";

import type { BinStatus } from "@/types";

export function fillLevelToStatus(fill: number, currentStatus: BinStatus): BinStatus {
  if (currentStatus === "collected" && fill === 0) {
    return "collected";
  }

  if (fill <= 24) return "empty";
  if (fill < 80) return "filling";
  return "full";
}

export interface IotReadingInput {
  bin_id: string;
  fill_level: number;
}

export interface ApplyIotReadingResult {
  success: boolean;
  alert_triggered: boolean;
  error?: string;
}

export async function applyIotReading(
  supabase: SupabaseClient,
  input: IotReadingInput,
): Promise<ApplyIotReadingResult> {
  const fill_level = Math.max(0, Math.min(100, Math.round(input.fill_level)));

  const { data: before, error: fetchError } = await supabase
    .from("bins")
    .select("fill_level, status")
    .eq("id", input.bin_id)
    .maybeSingle();

  if (fetchError) {
    return { success: false, alert_triggered: false, error: fetchError.message };
  }

  if (!before) {
    return { success: false, alert_triggered: false, error: "Bin not found" };
  }

  const previousFill = before.fill_level ?? 0;
  const currentStatus = (before.status as BinStatus) ?? "empty";
  const status = fillLevelToStatus(fill_level, currentStatus);

  const { error: updateError } = await supabase
    .from("bins")
    .update({
      fill_level,
      status,
      last_updated: new Date().toISOString(),
    })
    .eq("id", input.bin_id);

  if (updateError) {
    return { success: false, alert_triggered: false, error: updateError.message };
  }

  const alert_triggered = previousFill < 80 && fill_level >= 80;

  return { success: true, alert_triggered };
}
