"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

import type { BinRow, PickupRow, RouteRow } from "@/types";

const LiveRouteTracker = dynamic(
  () => import("@/components/maps/LiveRouteTracker").then((mod) => mod.LiveRouteTracker),
  { ssr: false },
);

import { haversineMeters } from "@/lib/utils/geo";

import { useBroadcastDriverLocation } from "@/hooks/useDriverLocation";
import { useRealtimeBins } from "@/hooks/useRealtimeBins";
import { useWatchPosition } from "@/hooks/useWatchPosition";

interface BinChecklistProps {
  route: RouteRow;
  bins: BinRow[];
  pickups: PickupRow[];
  driverId: string;
}

export function BinChecklist({ route, bins, pickups: initialPickups, driverId }: BinChecklistProps) {
  const client = useMemo(() => createClient(), []);

  const orderedSeed = useMemo(() => {
    const orderIds = route.bin_ids ?? [];

    return [...bins].sort((first, second) => orderIds.indexOf(first.id) - orderIds.indexOf(second.id));
  }, [bins, route.bin_ids]);

  const { bins: orderedBins } = useRealtimeBins(orderedSeed);

  const pickupSet = useMemo(() => new Set(initialPickups.map((pickup) => pickup.bin_id)), [initialPickups]);

  const [done, setDone] = useState<Set<string>>(pickupSet);

  useEffect(() => {
    const autoCollected = orderedBins
      .filter((bin) => bin.status === "empty" || bin.fill_level === 0)
      .map((bin) => bin.id);

    if (!autoCollected.length) return;

    setDone((current) => {
      const next = new Set(current);
      autoCollected.forEach((id) => next.add(id));
      return next;
    });
  }, [orderedBins]);
  const total = orderedBins.length;
  const progress = Math.round((done.size / Math.max(total, 1)) * 100);

  const broadcastLocation = useBroadcastDriverLocation();

  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      broadcastLocation({
        driverId,
        routeId: route.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }).catch(console.error);

      void position;
    },
    [broadcastLocation, driverId, route.id],
  );

  useWatchPosition(true, handlePosition);

  async function capture(bin: BinRow) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const distance = haversineMeters(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          { lat: bin.latitude, lng: bin.longitude },
        );

        if (distance > 100) {
          toast.error("Move closer than 100m to confirm capture");
          return;
        }

        const { error: pickupErr } = await client.from("pickups").insert({
          route_id: route.id,
          bin_id: bin.id,
          driver_id: driverId,
          driver_latitude: position.coords.latitude,
          driver_longitude: position.coords.longitude,
        });

        if (pickupErr) {
          toast.error(pickupErr.message);
          return;
        }

        await client.from("bins").update({ status: "collected", fill_level: 0 }).eq("id", bin.id);

        setDone((current) => {
          const next = new Set(current);

          next.add(bin.id);

          return next;
        });

        toast.success(`${bin.label} captured`);
      },
      () => toast.error("Enable GPS to continue"),
      { enableHighAccuracy: true },
    );
  }

  useEffect(() => {
    async function activate() {
      if (route.status === "pending") {
        await client.from("routes").update({ status: "active" }).eq("id", route.id);
      }
    }

    void activate();

    //
  }, [client, route.id, route.status]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.45em] text-[#475569]">Mission progress</p>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span>{done.size}</span>/<span>{total}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#0f172a]">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <LiveRouteTracker
        bins={orderedBins}
        binOrder={route.bin_ids ?? []}
        driverId={driverId}
        routeId={route.id}
        driverName="You"
        driverLocation={null}
        collectedBinIds={Array.from(done)}
      />

      <div className="space-y-3">
        {orderedBins.map((bin) => {
          const captured = done.has(bin.id);

          return (
            <div key={bin.id} className="rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-white">{bin.label}</p>
                <p className="text-xs text-[#64748b] capitalize">{bin.bin_type}</p>
              </div>
              <Button
                className="mt-4 w-full"
                type="button"
                disabled={captured}
                onClick={() => capture(bin)}
              >
                {captured ? "Captured" : "Mark collected"}
              </Button>
            </div>
          );
        })}
      </div>

      {done.size === total ? (
        <Button asChild className="w-full">
          <Link href="/driver/checkin">End route & check in facility</Link>
        </Button>
      ) : null}
    </div>
  );
}
