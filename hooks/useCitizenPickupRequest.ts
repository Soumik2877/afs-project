"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  distanceToPickupMeters,
  estimateArrivalMinutes,
  formatDistanceMeters,
  formatEtaMinutes,
} from "@/lib/citizen-pickup/eta";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeChannelName } from "@/lib/supabase/realtime-channel";
import type { CitizenPickupRequestRow, DriverLocationRow } from "@/types";

export type CitizenPickupRequestState = ReturnType<typeof useCitizenPickupRequest>;

export function useCitizenPickupRequest(
  citizenId: string | undefined,
  routeId: string | undefined,
  driverLocation: DriverLocationRow | null,
) {
  const supabase = useMemo(() => createClient(), []);
  const channelName = useRealtimeChannelName("citizen_pickup", citizenId ?? "none");
  const [request, setRequest] = useState<CitizenPickupRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tableMissing, setTableMissing] = useState(false);

  const refresh = useCallback(async () => {
    if (!citizenId) {
      setRequest(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("citizen_pickup_requests")
      .select("*")
      .eq("citizen_id", citizenId)
      .in("status", ["pending", "en_route", "arrived", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error?.code === "PGRST205") {
      setTableMissing(true);
      setRequest(null);
      setLoading(false);
      return;
    }

    setTableMissing(false);

    if (data && data.status === "completed") {
      const completedAt = new Date(data.completed_at ?? data.created_at).getTime();
      if (Date.now() - completedAt > 12_000) {
        setRequest(null);
      } else {
        setRequest(data as CitizenPickupRequestRow);
      }
    } else {
      setRequest((data as CitizenPickupRequestRow) ?? null);
    }

    setLoading(false);
  }, [citizenId, supabase]);

  useEffect(() => {
    void refresh();
  }, [refresh, routeId]);

  useEffect(() => {
    if (!citizenId || tableMissing) return;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "citizen_pickup_requests",
          filter: `citizen_id=eq.${citizenId}`,
        },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, citizenId, refresh, supabase, tableMissing]);

  const distanceMeters = useMemo(() => {
    if (!request || request.status === "completed") return null;
    return distanceToPickupMeters(driverLocation, request);
  }, [driverLocation, request]);

  const etaMinutes = useMemo(() => estimateArrivalMinutes(distanceMeters), [distanceMeters]);

  const requestPickup = useCallback(
    async (latitude: number, longitude: number) => {
      setSubmitting(true);
      try {
        const res = await fetch("/api/citizen-pickup/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, route_id: routeId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Request failed");
        setRequest(json.request as CitizenPickupRequestRow);
        return json.request as CitizenPickupRequestRow;
      } finally {
        setSubmitting(false);
      }
    },
    [routeId],
  );

  const confirmPickup = useCallback(async () => {
    if (!request) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/citizen-pickup/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: request.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Confirm failed");
      setRequest(json.request as CitizenPickupRequestRow);
      setTimeout(() => setRequest(null), 10_000);
    } finally {
      setSubmitting(false);
    }
  }, [request]);

  const cancelPickup = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/citizen-pickup/cancel", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Cancel failed");
      setRequest(null);
      return json;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    request,
    loading,
    submitting,
    tableMissing,
    distanceMeters,
    distanceLabel: formatDistanceMeters(distanceMeters),
    etaLabel: formatEtaMinutes(etaMinutes),
    etaMinutes,
    requestPickup,
    confirmPickup,
    cancelPickup,
    refresh,
  };
}
