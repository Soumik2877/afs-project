"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { DriverLocationRow } from "@/types";

export function useDriverLocationStream(
  driverId: string | null | undefined,
  seed: DriverLocationRow | null,
) {
  const [location, setLocation] = useState<DriverLocationRow | null>(seed);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setLocation(seed);
  }, [seed]);

  useEffect(() => {
    if (!driverId) return;

    const channel = supabase.channel(`driver_loc_${driverId}`);

    channel
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "driver_locations",
          event: "*",
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          if ("new" in payload && payload.new) {
            setLocation(payload.new as DriverLocationRow);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [driverId, supabase]);

  return location;
}
