"use client";

import { useEffect, useMemo, useState } from "react";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { useRealtimeChannelName } from "@/lib/supabase/realtime-channel";
import type { BinRow } from "@/types";

interface UseRealtimeBinsResult {
  bins: BinRow[];
  error: Error | null;
}

export function useRealtimeBins(seed: BinRow[]): UseRealtimeBinsResult {
  const [bins, setBins] = useState(seed);
  const [error, setError] = useState<Error | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const channelName = useRealtimeChannelName("bins_feed", "all");

  useEffect(() => {
    setBins(seed);
  }, [seed]);

  useEffect(() => {
    const channel = supabase.channel(channelName);

    channel
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "bins",
          event: "*",
        },
        (payload: RealtimePostgresChangesPayload<Partial<BinRow>>) => {
          const incoming = payload.new as Partial<BinRow> | null;

          if (!incoming?.id) return;

          setBins((current) => {
            const exists = current.some((row) => row.id === incoming.id);
            if (!exists) {
              return [...current, incoming as BinRow];
            }
            return current.map((row) =>
              incoming.id === row.id ? { ...row, ...(incoming as BinRow) } : row,
            );
          });
        },
      )
      .subscribe((status, subscriptionError) => {
        if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          setError(subscriptionError instanceof Error ? subscriptionError : new Error("Realtime channel failed"));
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, supabase]);

  return { bins, error };
}
