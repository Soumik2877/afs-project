import { nextDriverPositionToward } from "@/lib/simulation/driver-movement";
import { haversineMeters } from "@/lib/utils/geo";

import type { DriverPosition, Waypoint } from "@/lib/simulation/driver-movement";

export const COLLECT_RADIUS_METERS = 80;

export interface RouteBinWaypoint extends Waypoint {
  id: string;
}

export interface SimulateRouteTickInput {
  driverId: string;
  routeId: string;
  orderedBins: RouteBinWaypoint[];
  collectedBinIds: Set<string>;
  current: DriverPosition | null;
  stepMeters: number;
}

export interface SimulateRouteTickResult {
  position: DriverPosition;
  collectedThisTick: string[];
  targetBinId: string | null;
  routeComplete: boolean;
}

export function simulateRouteTick(input: SimulateRouteTickInput): SimulateRouteTickResult {
  const { orderedBins, collectedBinIds, current, stepMeters } = input;

  const collectedThisTick: string[] = [];
  const pending = orderedBins.filter((bin) => !collectedBinIds.has(bin.id));

  if (!pending.length) {
    const last = orderedBins[orderedBins.length - 1];
    return {
      position: current ?? {
        latitude: last?.latitude ?? 12.97,
        longitude: last?.longitude ?? 77.59,
        updated_at: new Date().toISOString(),
      },
      collectedThisTick,
      targetBinId: null,
      routeComplete: true,
    };
  }

  const target = pending[0]!;
  let position = nextDriverPositionToward(current, target, stepMeters);

  const dist = haversineMeters(
    { lat: position.latitude, lng: position.longitude },
    { lat: target.latitude, lng: target.longitude },
  );

  if (dist <= COLLECT_RADIUS_METERS) {
    position = {
      latitude: target.latitude,
      longitude: target.longitude,
      updated_at: new Date().toISOString(),
    };
    collectedThisTick.push(target.id);
  }

  const remainingAfter = pending.length - collectedThisTick.length;

  return {
    position,
    collectedThisTick,
    targetBinId: target.id,
    routeComplete: remainingAfter <= 0 && collectedThisTick.length > 0,
  };
}
