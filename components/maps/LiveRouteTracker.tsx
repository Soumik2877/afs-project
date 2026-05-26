"use client";

import dynamic from "next/dynamic";

import { useDriverLocationStream } from "@/hooks/useDriverLocationStream";
import type { BinRow, CitizenPickupRequestRow, DriverLocationRow } from "@/types";

const LiveRouteMap = dynamic(() => import("@/components/maps/LiveRouteMap"), { ssr: false });

interface LiveRouteTrackerProps {
  bins: BinRow[];
  binOrder: string[];
  routeId: string;
  driverName?: string | null;
  /** Live location from parent (citizen dashboard). */
  driverLocation?: DriverLocationRow | null;
  /** Subscribe here when parent does not stream (admin/driver views). */
  driverId?: string;
  collectedBinIds: string[];
  citizenPickup?: CitizenPickupRequestRow | null;
}

export function LiveRouteTracker({
  driverLocation: driverLocationProp,
  driverId,
  ...props
}: LiveRouteTrackerProps) {
  const streamed = useDriverLocationStream(driverId ?? null, driverLocationProp ?? null);
  const driverLocation = driverId ? streamed : (driverLocationProp ?? null);

  return <LiveRouteMap {...props} driverLocation={driverLocation} />;
}
