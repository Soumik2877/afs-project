import { COLLECT_RADIUS_METERS } from "@/lib/simulation/route-collection";
import { nextDriverPositionToward, type DriverPosition } from "@/lib/simulation/driver-movement";
import { haversineMeters } from "@/lib/utils/geo";

export interface CitizenDetourTarget {
  latitude: number;
  longitude: number;
}

export interface CitizenDetourTickResult {
  position: DriverPosition;
  arrived: boolean;
}

export function simulateCitizenDetourTick(
  current: DriverPosition | null,
  target: CitizenDetourTarget,
  stepMeters: number,
): CitizenDetourTickResult {
  const waypoint = { latitude: target.latitude, longitude: target.longitude };
  const position = nextDriverPositionToward(current, waypoint, stepMeters);

  const dist = haversineMeters(
    { lat: position.latitude, lng: position.longitude },
    { lat: target.latitude, lng: target.longitude },
  );

  if (dist <= COLLECT_RADIUS_METERS) {
    return {
      position: {
        latitude: target.latitude,
        longitude: target.longitude,
        updated_at: new Date().toISOString(),
      },
      arrived: true,
    };
  }

  return { position, arrived: false };
}
