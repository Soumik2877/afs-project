import type { SupabaseClient } from "@supabase/supabase-js";

import { getDemoRouteName, isDemoRouteLoopEnabled } from "@/lib/simulation/demo-loop";
import type { BinRow, DriverLocationRow, RouteRow } from "@/types";

export interface ActiveRouteTracking {
  route: RouteRow;
  bins: BinRow[];
  driverLocation: DriverLocationRow | null;
  driverName: string | null;
  collectedBinIds: string[];
}

/** Finds today's active route with bins in the given locality (or any active route if locality unset). */
export async function getActiveRouteForTracking(
  supabase: SupabaseClient,
  options?: { locality?: string | null; routeId?: string | null },
): Promise<ActiveRouteTracking | null> {
  const today = new Date().toISOString().slice(0, 10);

  if (options?.routeId) {
    const { data: byId } = await supabase.from("routes").select("*").eq("id", options.routeId).maybeSingle();
    if (byId) {
      return loadRouteTracking(supabase, byId as RouteRow, options.locality);
    }
    return null;
  }

  if (isDemoRouteLoopEnabled()) {
    const { data: demoRoute } = await supabase
      .from("routes")
      .select("*")
      .eq("name", getDemoRouteName())
      .eq("status", "active")
      .order("shift_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (demoRoute) {
      // Demo route bins use DEMO_ROUTE_LOCALITY — do not filter by citizen profile locality.
      return loadRouteTracking(supabase, demoRoute as RouteRow, null);
    }
  }

  let routeQuery = supabase.from("routes").select("*").eq("status", "active").eq("shift_date", today);

  const { data: routes } = await routeQuery.order("created_at", { ascending: false });

  if (!routes?.length) return null;

  let route = routes[0] as RouteRow;

  if (options?.locality) {
    const matched = await Promise.all(
      routes.map(async (candidate) => {
        const binIds = (candidate.bin_ids as string[]) ?? [];
        if (!binIds.length) return null;

        const { data: localityBins } = await supabase
          .from("bins")
          .select("id")
          .in("id", binIds)
          .eq("locality", options.locality!)
          .limit(1);

        return localityBins?.length ? (candidate as RouteRow) : null;
      }),
    );

    route = (matched.find(Boolean) as RouteRow | undefined) ?? route;
  }

  return loadRouteTracking(supabase, route, options?.locality);
}

async function loadRouteTracking(
  supabase: SupabaseClient,
  route: RouteRow,
  locality?: string | null,
): Promise<ActiveRouteTracking | null> {
  const binIds = (route.bin_ids as string[])?.filter(Boolean) ?? [];

  if (!binIds.length || !route.assigned_driver_id) return null;

  const [{ data: bins }, { data: driverLocation }, { data: driver }, { data: pickups }] =
    await Promise.all([
      supabase.from("bins").select("*").in("id", binIds),
      supabase
        .from("driver_locations")
        .select("*")
        .eq("driver_id", route.assigned_driver_id)
        .maybeSingle(),
      supabase.from("users").select("full_name").eq("id", route.assigned_driver_id).maybeSingle(),
      supabase.from("pickups").select("bin_id").eq("route_id", route.id),
    ]);

  let orderedBins = [...(bins ?? [])].sort((a, b) => binIds.indexOf(a.id) - binIds.indexOf(b.id));

  if (locality) {
    orderedBins = orderedBins.filter((bin) => bin.locality === locality);
    if (!orderedBins.length) return null;
  }

  return {
    route,
    bins: orderedBins,
    driverLocation: driverLocation ?? null,
    driverName: driver?.full_name ?? null,
    collectedBinIds: (pickups ?? []).map((row) => row.bin_id as string),
  };
}
