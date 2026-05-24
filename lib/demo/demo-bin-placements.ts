import placementsJson from "./demo-bin-placements.json";

export type DemoBinPlacementRow = {
  suffix: string;
  latitude: number;
  longitude: number;
  fillLevel: number;
  status: "empty" | "filling" | "full";
  binType: "general" | "organic" | "recyclable";
};

export const DEMO_BIN_PLACEMENTS = placementsJson as DemoBinPlacementRow[];

export function getDemoRouteCenter() {
  const n = DEMO_BIN_PLACEMENTS.length;
  const latitude = DEMO_BIN_PLACEMENTS.reduce((sum, b) => sum + b.latitude, 0) / n;
  const longitude = DEMO_BIN_PLACEMENTS.reduce((sum, b) => sum + b.longitude, 0) / n;
  return { latitude, longitude };
}
