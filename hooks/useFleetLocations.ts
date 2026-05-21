"use client";

import { useEffect, useMemo } from "react";

import type { DriverLocationRow } from "@/types";
import { createClient } from "@/lib/supabase/client";

export function useFleetLocationStream(onUpdate: (payload: Partial<DriverLocationRow>) => void) {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase.channel("fleet_feed");

    channel.on(
      "postgres_changes",
      {
        schema: "public",
        table: "driver_locations",
        event: "*",
      },
      (payload) => {
        if ("new" in payload && payload.new) {
          onUpdate(payload.new as DriverLocationRow);
        }
      },
    );

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onUpdate, supabase]);
}
