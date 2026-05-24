import type { SupabaseClient } from "@supabase/supabase-js";

import { DEMO_BIN_PLACEMENTS } from "@/lib/demo/demo-bin-placements";
import { getDemoBinLabelPrefix } from "@/lib/demo/rectangle-route";

export function getDemoRouteName() {
  return process.env.DEMO_ROUTE_NAME ?? "Kalaikunda";
}

export function getDemoRouteLocality() {
  return process.env.DEMO_ROUTE_LOCALITY ?? "Kalaikunda";
}

/** Legacy route names replaced by the Kalaikunda demo loop. */
export const LEGACY_DEMO_ROUTE_NAMES = [
  "Demo Koramangala Loop",
  "Demo Rectangle Loop",
  "Koramangala Loop",
] as const;

export function isDemoRouteLoopEnabled() {
  return process.env.DEMO_ROUTE_LOOP !== "false";
}

export function isDemoLoopRoute(routeName: string | null | undefined) {
  return isDemoRouteLoopEnabled() && routeName === getDemoRouteName();
}

/** Keeps the demo route active and dated for today (UI + simulation). */
export async function ensureDemoRouteActive(supabase: SupabaseClient) {
  if (!isDemoRouteLoopEnabled()) return;

  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("routes")
    .update({ status: "active", shift_date: today })
    .eq("name", getDemoRouteName());
}

/** Clears pickups and restores bin fill levels for the next lap (01 → 05). */
export async function resetDemoRouteLap(
  supabase: SupabaseClient,
  routeId: string,
  driverId: string,
  binIds: string[],
) {
  await supabase.from("pickups").delete().eq("route_id", routeId).eq("driver_id", driverId);

  const prefix = getDemoBinLabelPrefix();
  const { data: bins } = await supabase.from("bins").select("id, label").in("id", binIds);

  for (const placement of DEMO_BIN_PLACEMENTS) {
    const label = `${prefix}${placement.suffix}`;
    const bin = bins?.find((row) => row.label === label);
    if (!bin) continue;

    await supabase
      .from("bins")
      .update({
        fill_level: placement.fillLevel,
        status: placement.status,
        last_updated: new Date().toISOString(),
      })
      .eq("id", bin.id);
  }
}
