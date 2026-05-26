"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useRealtimeChannelName } from "@/lib/supabase/realtime-channel";
import type { DriverLocationRow } from "@/types";

const POLL_MS = Number(process.env.NEXT_PUBLIC_DRIVER_LOCATION_POLL_MS ?? 2000);

function isSameLocation(a: DriverLocationRow | null, b: DriverLocationRow | null) {
  if (!a || !b) return false;
  return (
    a.latitude === b.latitude &&
    a.longitude === b.longitude &&
    a.updated_at === b.updated_at
  );
}

export function useDriverLocationStream(
  driverId: string | null | undefined,
  seed: DriverLocationRow | null,
) {
  const [location, setLocation] = useState<DriverLocationRow | null>(seed);
  const supabase = useMemo(() => createClient(), []);
  const channelName = useRealtimeChannelName("driver_loc", driverId ?? "none");

  useEffect(() => {
    setLocation(seed);
  }, [seed]);

  useEffect(() => {
    if (!driverId) return;

    let active = true;

    async function poll() {
      const { data } = await supabase
        .from("driver_locations")
        .select("*")
        .eq("driver_id", driverId)
        .maybeSingle();

      if (!active || !data) return;

      setLocation((prev) => (isSameLocation(prev, data) ? prev : (data as DriverLocationRow)));
    }

    void poll();
    const interval = setInterval(poll, POLL_MS);

    const channel = supabase
      .channel(channelName)
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
            const next = payload.new as DriverLocationRow;
            setLocation((prev) => (isSameLocation(prev, next) ? prev : next));
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [channelName, driverId, supabase]);

  return location;
}
