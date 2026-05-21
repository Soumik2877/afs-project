"use client";

import { useCallback, useMemo } from "react";

import { createClient } from "@/lib/supabase/client";

interface BroadcastLocationParams {
  driverId: string;
  routeId: string | null;
  latitude: number;
  longitude: number;
}

export function useBroadcastDriverLocation() {
  const supabase = useMemo(() => createClient(), []);

  return useCallback(
    async ({ driverId, routeId, latitude, longitude }: BroadcastLocationParams) => {
      await supabase.from("driver_locations").upsert(
        {
          driver_id: driverId,
          route_id: routeId,
          latitude,
          longitude,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "driver_id",
        },
      );
    },
    [supabase],
  );
}
