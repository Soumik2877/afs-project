"use client";

import dynamic from "next/dynamic";

import Link from "next/link";

import { MapErrorBoundary } from "@/components/maps/MapErrorBoundary";
import { Button } from "@/components/ui/button";
import type { ActiveRouteTracking } from "@/lib/routes/active-route";

const LiveRouteTracker = dynamic(
  () => import("@/components/maps/LiveRouteTracker").then((mod) => mod.LiveRouteTracker),
  { ssr: false },
);

const CitizenTrackMap = dynamic(() => import("@/components/maps/CitizenTrackMap"), { ssr: false });

interface CitizenHomeProps {
  tracking: ActiveRouteTracking | null;
  localityLabel?: string | null;
}

export function CitizenDashboard({ tracking, localityLabel }: CitizenHomeProps) {
  const etaMinutes = tracking?.driverLocation ? 12 : undefined;

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
        <Button variant="outline" className="mt-8 px-12 py-6 text-lg uppercase tracking-[0.45em]" type="button" asChild>
          <Link href="/citizen/report">Report anomaly</Link>
        </Button>
      </section>

      {tracking ? (
        <MapErrorBoundary>
          <LiveRouteTracker
            bins={tracking.bins}
            binOrder={tracking.route.bin_ids}
            driverId={tracking.route.assigned_driver_id!}
            routeId={tracking.route.id}
            driverName={tracking.driverName}
            driverLocation={tracking.driverLocation}
            collectedBinIds={tracking.collectedBinIds}
          />
        </MapErrorBoundary>
      ) : (
        <CitizenTrackMap driver={null} etaMinutes={etaMinutes} />
      )}

      <div className="rounded-[28px] border border-[#1F2937] bg-[#0f172d] px-6 py-5 text-sm">
        Servicing routes for your locality.
        <p className="mt-2 font-mono text-base text-emerald-200">{localityLabel ?? "Koramangala"}</p>
        {!tracking ? (
          <p className="mt-2 text-xs text-[#64748B]">
            No active route today — admin must set route status to active with today&apos;s date.
          </p>
        ) : null}
      </div>
    </div>
  );
}
