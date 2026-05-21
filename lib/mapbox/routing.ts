import type { BinRow } from "@/types";

export type BinCoord = Pick<BinRow, "id" | "longitude" | "latitude">;

export interface OptimizeRouteOptions {
  bins: BinCoord[];
  start?: { lng: number; lat: number };
  accessToken?: string;
}

/**
 * Orders bins via Mapbox Optimization API. Falls back to input order on error.
 */
export async function optimizeBinOrder({
  bins,
  start,
  accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
}: OptimizeRouteOptions): Promise<string[]> {
  const fallbackIds = bins.map((bin) => bin.id);

  if (!bins.length) return [];
  if (!accessToken) return fallbackIds;

  let coordinateSegments = bins.map((b) => `${b.longitude},${b.latitude}`).join(";");

  if (start) {
    coordinateSegments = `${start.lng},${start.lat};${coordinateSegments}`;
  }

  const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinateSegments}?roundtrip=false&source=first&destination=last&steps=false&geometries=geojson&overview=false&access_token=${encodeURIComponent(accessToken)}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    return fallbackIds;
  }

  interface OptimizedWaypoint {
    waypoint_index: number;
  }

  const waypoints = (data?.waypoints ?? data?.trips?.[0]?.waypoints ?? []) as OptimizedWaypoint[];

  if (!waypoints.length) {
    return fallbackIds;
  }

  const offset = start ? 1 : 0;

  const ordered = [...waypoints]
    .sort((a, b) => (a?.waypoint_index ?? 0) - (b?.waypoint_index ?? 0))
    .map((waypoint, idxForFallback) => {
      const sourceIndex =
        waypoint.waypoint_index !== undefined
          ? Math.max(waypoint.waypoint_index - offset, 0)
          : idxForFallback;

      return bins[sourceIndex] ?? bins[idxForFallback % bins.length];
    })
    .filter(Boolean);

  const deduped: string[] = [];

  ordered.forEach((binLike) => {
    if (!deduped.includes(binLike.id)) deduped.push(binLike.id);
  });

  bins.forEach((bin) => {
    if (!deduped.includes(bin.id)) deduped.push(bin.id);
  });

  return deduped;
}
