import { deg2rad, haversineMeters } from "@/lib/utils/geo";

export interface Waypoint {
  latitude: number;
  longitude: number;
}

export interface DriverPosition {
  latitude: number;
  longitude: number;
  updated_at: string;
}

const EARTH_RADIUS_M = 6371000;

function bearingRadians(from: Waypoint, to: Waypoint) {
  const lat1 = deg2rad(from.latitude);
  const lat2 = deg2rad(to.latitude);
  const dLng = deg2rad(to.longitude - from.longitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return Math.atan2(y, x);
}

function offsetMeters(origin: Waypoint, bearing: number, distanceM: number): Waypoint {
  const lat1 = deg2rad(origin.latitude);
  const lng1 = deg2rad(origin.longitude);
  const angular = distanceM / EARTH_RADIUS_M;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing),
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lng2 * 180) / Math.PI,
  };
}

function nearestWaypointIndex(current: Waypoint, waypoints: Waypoint[]) {
  let best = 0;
  let bestDist = Infinity;

  waypoints.forEach((point, index) => {
    const dist = haversineMeters(
      { lat: current.latitude, lng: current.longitude },
      { lat: point.latitude, lng: point.longitude },
    );

    if (dist < bestDist) {
      bestDist = dist;
      best = index;
    }
  });

  return best;
}

/** Move toward a single target waypoint (used for ordered route simulation). */
export function nextDriverPositionToward(
  current: DriverPosition | null,
  target: Waypoint,
  stepMeters: number,
): DriverPosition {
  const now = new Date().toISOString();

  const start =
    current ??
    ({
      latitude: target.latitude,
      longitude: target.longitude,
      updated_at: now,
    } as DriverPosition);

  const from: Waypoint = { latitude: start.latitude, longitude: start.longitude };

  const distToTarget = haversineMeters(
    { lat: from.latitude, lng: from.longitude },
    { lat: target.latitude, lng: target.longitude },
  );

  if (distToTarget <= stepMeters) {
    return {
      latitude: target.latitude,
      longitude: target.longitude,
      updated_at: now,
    };
  }

  const bearing = bearingRadians(from, target);
  const moved = offsetMeters(from, bearing, stepMeters);

  return {
    latitude: moved.latitude,
    longitude: moved.longitude,
    updated_at: now,
  };
}

/** Advance driver position along ordered route waypoints by `stepMeters`. */
export function nextDriverPosition(
  current: DriverPosition | null,
  waypoints: Waypoint[],
  stepMeters: number,
): DriverPosition {
  const now = new Date().toISOString();

  if (!waypoints.length) {
    return {
      latitude: current?.latitude ?? 0,
      longitude: current?.longitude ?? 0,
      updated_at: now,
    };
  }

  const start =
    current ??
    ({
      latitude: waypoints[0]!.latitude,
      longitude: waypoints[0]!.longitude,
      updated_at: now,
    } as DriverPosition);

  const from: Waypoint = { latitude: start.latitude, longitude: start.longitude };
  const nearest = nearestWaypointIndex(from, waypoints);
  const targetIndex = (nearest + 1) % waypoints.length;
  const target = waypoints[targetIndex]!;

  return nextDriverPositionToward(start, target, stepMeters);
}

/** Position far from route + stale timestamp to trigger anomaly-check. */
export function anomalyDemoPosition(waypoints: Waypoint[]): DriverPosition {
  const anchor = waypoints[0] ?? { latitude: 12.97, longitude: 77.59 };
  const far = offsetMeters(anchor, deg2rad(45), 2500);
  const stale = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  return {
    latitude: far.latitude,
    longitude: far.longitude,
    updated_at: stale,
  };
}
