import type { LineLayerSpecification } from "mapbox-gl";

import { projectPointOnSegment } from "@/lib/utils/geo";
import type { BinRow } from "@/types";

const ROUTE_GREEN = "#10B981";
const ROUTE_ORANGE = "#F97316";

export function isBinCollectedForRoute(bin: BinRow, collectedBinIds: Set<string>) {
  return (
    collectedBinIds.has(bin.id) ||
    bin.status === "empty" ||
    (bin.fill_level === 0 && bin.status !== "filling")
  );
}

/** Fixed bin-to-bin segments; covered legs turn orange as the truck progresses. */
export function buildRouteSegmentCollection(
  orderedBins: BinRow[],
  collectedBinIds: Set<string>,
  truck?: { latitude: number; longitude: number } | null,
) {
  const features: GeoJSON.Feature<GeoJSON.LineString, { covered: boolean }>[] = [];

  if (orderedBins.length < 2) {
    return { type: "FeatureCollection" as const, features };
  }

  let activeSegmentIndex: number | null = null;
  for (let i = 0; i < orderedBins.length - 1; i++) {
    if (!isBinCollectedForRoute(orderedBins[i + 1]!, collectedBinIds)) {
      activeSegmentIndex = i;
      break;
    }
  }

  for (let i = 0; i < orderedBins.length - 1; i++) {
    const from = orderedBins[i]!;
    const to = orderedBins[i + 1]!;
    const fromCoord: [number, number] = [from.longitude, from.latitude];
    const toCoord: [number, number] = [to.longitude, to.latitude];

    if (isBinCollectedForRoute(to, collectedBinIds)) {
      features.push({
        type: "Feature",
        properties: { covered: true },
        geometry: { type: "LineString", coordinates: [fromCoord, toCoord] },
      });
      continue;
    }

    if (truck && activeSegmentIndex !== null && i === activeSegmentIndex) {
      const projected = projectPointOnSegment(
        { lat: truck.latitude, lng: truck.longitude },
        { lat: from.latitude, lng: from.longitude },
        { lat: to.latitude, lng: to.longitude },
      );
      const splitCoord: [number, number] = [projected.lng, projected.lat];

      if (projected.t > 0.02) {
        features.push({
          type: "Feature",
          properties: { covered: true },
          geometry: { type: "LineString", coordinates: [fromCoord, splitCoord] },
        });
      }

      if (projected.t < 0.98) {
        features.push({
          type: "Feature",
          properties: { covered: false },
          geometry: { type: "LineString", coordinates: [splitCoord, toCoord] },
        });
      }

      continue;
    }

    features.push({
      type: "Feature",
      properties: { covered: false },
      geometry: { type: "LineString", coordinates: [fromCoord, toCoord] },
    });
  }

  return { type: "FeatureCollection" as const, features };
}

/** Shared paint — v3 lighting needs emissive strength or lines render black/invisible. */
const routeLineBase: LineLayerSpecification["paint"] = {
  "line-width": 7,
  "line-opacity": 1,
  "line-emissive-strength": 1,
};

export const routeLinePaintCovered: LineLayerSpecification["paint"] = {
  ...routeLineBase,
  "line-color": ROUTE_ORANGE,
};

export const routeLinePaintAhead: LineLayerSpecification["paint"] = {
  ...routeLineBase,
  "line-color": ROUTE_GREEN,
};

/** @deprecated Use filtered covered/ahead layers instead */
export const routeLinePaint: LineLayerSpecification["paint"] = {
  "line-color": ["case", ["boolean", ["get", "covered"], false], ROUTE_ORANGE, ROUTE_GREEN],
  ...routeLineBase,
};
