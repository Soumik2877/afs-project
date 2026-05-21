"use client";

import dynamic from "next/dynamic";

import type { BinRow, DriverLocationRow } from "@/types";

const LiveRouteMap = dynamic(() => import("@/components/maps/LiveRouteMap"), { ssr: false });

interface LiveRouteTrackerProps {
  bins: BinRow[];
  binOrder: string[];
  driverId: string;
  routeId: string;
  driverName?: string | null;
  driverLocation: DriverLocationRow | null;
  collectedBinIds: string[];
}

export function LiveRouteTracker(props: LiveRouteTrackerProps) {
  return <LiveRouteMap {...props} initialDriverLocation={props.driverLocation} />;
}
