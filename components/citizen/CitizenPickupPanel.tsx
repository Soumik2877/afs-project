"use client";

import { useState } from "react";
import { MapPin, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCitizenPickupRequest } from "@/hooks/useCitizenPickupRequest";
import { useDriverLocationStream } from "@/hooks/useDriverLocationStream";
import type { DriverLocationRow } from "@/types";

interface CitizenPickupPanelProps {
  citizenId: string;
  routeId: string;
  driverId: string;
  initialDriverLocation: DriverLocationRow | null;
}

export function CitizenPickupPanel({
  citizenId,
  routeId,
  driverId,
  initialDriverLocation,
}: CitizenPickupPanelProps) {
  const driverLocation = useDriverLocationStream(driverId, initialDriverLocation);
  const [geoLoading, setGeoLoading] = useState(false);
  const {
    request,
    loading,
    submitting,
    distanceLabel,
    etaLabel,
    requestPickup,
    confirmPickup,
  } = useCitizenPickupRequest(citizenId, routeId, driverLocation);

  async function pinAt(latitude: number, longitude: number) {
    try {
      await requestPickup(latitude, longitude);
      toast.success("Pickup requested — truck is rerouting to you.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request pickup");
    }
  }

  async function pinDemoSpotOnRoute() {
    await pinAt(22.3345, 87.2225);
  }

  async function pinMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await pinAt(pos.coords.latitude, pos.coords.longitude);
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        toast.error("Could not read your location. Allow location access and try again.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  const isActive = request && ["pending", "en_route", "arrived"].includes(request.status);
  const hasArrived = request?.status === "arrived";
  const isCompleted = request?.status === "completed";

  return (
    <div className="space-y-4">
      {!isActive && !isCompleted ? (
        <div className="space-y-2">
          <Button
            type="button"
            className="w-full gap-2 py-6 text-base font-semibold"
            disabled={loading || geoLoading || submitting}
            onClick={() => void pinMyLocation()}
          >
            <MapPin className="h-5 w-5" />
            {geoLoading || submitting ? "Pinning location…" : "Request pickup at my location"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs text-emerald-200/80 underline-offset-2 hover:text-emerald-100 hover:underline"
            disabled={loading || submitting}
            onClick={() => void pinDemoSpotOnRoute()}
          >
            Demo: pin on Kalaikunda route (if GPS is far away)
          </button>
        </div>
      ) : null}

      {isActive || isCompleted ? (
        <div
          className={cn(
            "rounded-2xl border px-5 py-4 transition-all",
            hasArrived
              ? "animate-pulse border-amber-400 bg-amber-500/20 shadow-[0_0_24px_rgba(251,191,36,0.35)]"
              : "border-emerald-500/40 bg-emerald-500/10",
            isCompleted && "animate-none border-emerald-400/50 bg-emerald-500/15",
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                hasArrived ? "bg-amber-500 text-[#0f172a]" : "bg-emerald-500 text-[#0f172a]",
              )}
            >
              <Truck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              {hasArrived ? (
                <>
                  <p className="text-lg font-bold text-amber-100">Truck has arrived!</p>
                  <p className="mt-1 text-sm text-amber-100/80">
                    Bring your waste out. Tap confirm when pickup is done.
                  </p>
                </>
              ) : isCompleted ? (
                <>
                  <p className="text-lg font-bold text-emerald-100">Pickup complete</p>
                  <p className="mt-1 text-sm text-emerald-100/80">
                    Truck is returning to the Kalaikunda route. +15 eco points.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
                    Truck en route to you
                  </p>
                  <p className="mt-2 font-mono text-2xl text-white">{etaLabel}</p>
                  <p className="mt-1 text-sm text-emerald-100/80">
                    Distance: <span className="font-semibold text-white">{distanceLabel}</span>
                  </p>
                </>
              )}
            </div>
          </div>

          {hasArrived ? (
            <Button
              type="button"
              className="mt-4 w-full bg-amber-500 font-semibold text-[#0f172a] hover:bg-amber-400"
              disabled={submitting}
              onClick={() => void confirmPickup()}
            >
              {submitting ? "Confirming…" : "Confirm pickup done"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
