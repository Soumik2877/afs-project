"use client";

import dynamic from "next/dynamic";

import { useEffect, useState } from "react";

import { MapErrorBoundary } from "@/components/maps/MapErrorBoundary";
import { useFleetLocationStream } from "@/hooks/useFleetLocations";

import type { DriverLocationRow } from "@/types";

const FleetMap = dynamic(() => import("@/components/maps/FleetMap"), { ssr: false });

export type FleetSeed = DriverLocationRow & {
  meta?: {
    full_name?: string | null;
    anomaly?: boolean;
    status?: string;
  };
};

interface FleetLiveProps {
  seed: FleetSeed[];
}

export function FleetLive({ seed }: FleetLiveProps) {
  const [drivers, setDrivers] = useState<FleetSeed[]>(seed);

  useEffect(() => {
    setDrivers(seed);
  }, [seed]);

  useFleetLocationStream((payload) => {
    const partial = payload as Partial<DriverLocationRow> & { driver_id?: string };

    setDrivers((current) => {
      const idx = current.findIndex((row) => row.driver_id === partial.driver_id);
      const mergedMeta = idx >= 0 ? current[idx]!.meta : undefined;

      if (idx >= 0) {
        const next = [...current];

        next[idx] = {
          ...next[idx],
          ...partial,
          meta: mergedMeta,
        } as FleetSeed;

        return next;
      }

      const baseRow: FleetSeed = {
        id: partial.id ?? crypto.randomUUID(),
        driver_id: partial.driver_id!,
        route_id: partial.route_id ?? null,
        latitude: partial.latitude ?? 0,
        longitude: partial.longitude ?? 0,
        updated_at: partial.updated_at ?? new Date().toISOString(),
        meta: mergedMeta,
      };

      return [...current, baseRow];
    });
  });

  return (
    <MapErrorBoundary>
      <FleetMap drivers={drivers} />
    </MapErrorBoundary>
  );
}
