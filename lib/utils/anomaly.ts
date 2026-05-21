import { haversineMeters } from "@/lib/utils/geo";

export interface DriverSnapshot {
  driverId: string;
  routeId: string | null;
  latitude: number;
  longitude: number;
  updatedAtIso: string;
}

export interface BinCoord {
  id: string;
  latitude: number;
  longitude: number;
}

const IDLE_MS = 10 * 60 * 1000;
const ROUTE_RADIUS_M = 500;

/** Flags drivers that are far from any route bin while GPS has been stale */
export function evaluateDriverAnomaly(driver: DriverSnapshot, routeBins: BinCoord[]): string | null {
  if (!routeBins.length || !driver.routeId) return null;

  let nearest = Infinity;

  for (const bin of routeBins) {
    const distance = haversineMeters(
      { lat: driver.latitude, lng: driver.longitude },
      { lat: bin.latitude, lng: bin.longitude },
    );

    if (distance < nearest) nearest = distance;
  }

  const idleTooLong = Date.now() - Date.parse(driver.updatedAtIso) > IDLE_MS;

  if (nearest > ROUTE_RADIUS_M && idleTooLong) {
    return `Driver is ${Math.round(nearest)}m from nearest waypoint while idle`;
  }

  return null;
}
