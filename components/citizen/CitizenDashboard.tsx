"use client";

import dynamic from "next/dynamic";

import Link from "next/link";

import { CitizenPickupPanel } from "@/components/citizen/CitizenPickupPanel";
import { MapErrorBoundary } from "@/components/maps/MapErrorBoundary";
import { Button } from "@/components/ui/button";
import { useCitizenPickupRequest } from "@/hooks/useCitizenPickupRequest";
import { useDriverLocationStream } from "@/hooks/useDriverLocationStream";
import type { ActiveRouteTracking } from "@/lib/routes/active-route";

const LiveRouteTracker = dynamic(
  () => import("@/components/maps/LiveRouteTracker").then((mod) => mod.LiveRouteTracker),
  { ssr: false },
);

const CitizenTrackMap = dynamic(() => import("@/components/maps/CitizenTrackMap"), { ssr: false });

interface CitizenHomeProps {
  tracking: ActiveRouteTracking | null;
  localityLabel?: string | null;
  citizenId?: string | null;
}

export function CitizenDashboard({ tracking, localityLabel, citizenId }: CitizenHomeProps) {
  const etaMinutes = tracking?.driverLocation ? 12 : undefined;
  const driverId = tracking?.route.assigned_driver_id ?? null;
  const driverLocation = useDriverLocationStream(driverId, tracking?.driverLocation ?? null);
  const pickup = useCitizenPickupRequest(
    citizenId ?? undefined,
    tracking?.route.id,
    driverLocation,
  );

  return (
    <div className="space-y-10">
      <section className="rounded-[32px] border border-emerald-500/30 bg-emerald-500/15 px-8 py-10 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.65em] text-emerald-200">Collection intelligence</p>
        <p className="mt-6 font-display text-4xl">Track my neighborhood pickups</p>
        {tracking ? (
          <p className="mt-4 text-sm text-emerald-100/90">
            Live truck on <span className="font-semibold">{tracking.route.name}</span>
            {tracking.driverName ? ` · ${tracking.driverName}` : ""}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start">
          {tracking && citizenId ? (
            <div className="flex-1">
              <CitizenPickupPanel pickup={pickup} />
            </div>
          ) : null}
          <Button variant="outline" className="px-12 py-6 text-lg uppercase tracking-[0.45em]" type="button" asChild>
            <Link href="/citizen/report">Report anomaly</Link>
          </Button>
        </div>
      </section>

      {tracking ? (
        <MapErrorBoundary>
          <LiveRouteTracker
            bins={tracking.bins}
            binOrder={tracking.route.bin_ids}
            routeId={tracking.route.id}
            driverName={tracking.driverName}
            driverLocation={driverLocation}
            collectedBinIds={tracking.collectedBinIds}
            citizenPickup={pickup.request}
          />
        </MapErrorBoundary>
      ) : (
        <CitizenTrackMap driver={null} etaMinutes={etaMinutes} />
      )}

      <div className="rounded-[28px] border border-[#1F2937] bg-[#0f172d] px-6 py-5 text-sm">
        Servicing routes for your locality.
        <p className="mt-2 font-mono text-base text-emerald-200">{localityLabel ?? "Kalaikunda"}</p>
        {!tracking ? (
          <p className="mt-2 text-xs text-[#64748B]">
            No active collection route — run <span className="font-mono">npm run seed:demo-route</span> and{" "}
            <span className="font-mono">npm run simulate:all</span>.
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#64748B]">
            Live loop · bins update automatically during simulation.
          </p>
        )}
      </div>
    </div>
  );
}
