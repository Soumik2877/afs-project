import type { SupabaseClient } from "@supabase/supabase-js";

/** Moves the driver GPS back onto the active route (next uncollected bin, or first bin). */
export async function snapDriverToRoute(
  supabase: SupabaseClient,
  routeId: string,
  driverId: string,
) {
  const { data: route } = await supabase.from("routes").select("bin_ids").eq("id", routeId).maybeSingle();

  const binIds = ((route?.bin_ids as string[]) ?? []).filter(Boolean);
  if (!binIds.length) return null;

  const [{ data: pickups }, { data: bins }] = await Promise.all([
    supabase.from("pickups").select("bin_id").eq("route_id", routeId).eq("driver_id", driverId),
    supabase.from("bins").select("id, latitude, longitude").in("id", binIds),
  ]);

  const collected = new Set((pickups ?? []).map((row) => row.bin_id as string));
  const binMap = new Map((bins ?? []).map((bin) => [bin.id as string, bin]));

  const target =
    binIds.map((id) => binMap.get(id)).find((bin) => bin && !collected.has(bin.id as string)) ??
    binMap.get(binIds[0]!);

  if (!target) return null;

  const now = new Date().toISOString();
  const row = {
    driver_id: driverId,
    route_id: routeId,
    latitude: target.latitude as number,
    longitude: target.longitude as number,
    updated_at: now,
  };

  const { data: existing } = await supabase
    .from("driver_locations")
    .select("id")
    .eq("driver_id", driverId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("driver_locations").update(row).eq("driver_id", driverId);
  } else {
    await supabase.from("driver_locations").insert(row);
  }

  return row;
}
