/**
 * Demo route: 5 dustbins on a rectangle (4 corners + center).
 * Configure via .env.local — see docs/demo-route-setup.md
 */

export type DemoRectangleConfig = {
  centerLat: number;
  centerLng: number;
  /** Half-height of rectangle in degrees (~0.001° ≈ 111 m). */
  latSpan: number;
  /** Half-width of rectangle in degrees. */
  lngSpan: number;
  locality: string;
  labelPrefix: string;
  routeName: string;
};

export type DemoBinPlacement = {
  label: string;
  latitude: number;
  longitude: number;
  corner: "SW" | "SE" | "NE" | "NW" | "CENTER";
  fillLevel: number;
  status: "empty" | "filling" | "full";
  binType: "general" | "organic" | "recyclable";
};

function parseNumber(raw: string | undefined, fallback: number) {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function parseDemoRectangleConfig(): DemoRectangleConfig {
  return {
    centerLat: parseNumber(process.env.DEMO_ROUTE_CENTER_LAT, 12.9716),
    centerLng: parseNumber(process.env.DEMO_ROUTE_CENTER_LNG, 77.5946),
    latSpan: parseNumber(process.env.DEMO_ROUTE_LAT_SPAN, 0.0012),
    lngSpan: parseNumber(process.env.DEMO_ROUTE_LNG_SPAN, 0.0018),
    locality: process.env.DEMO_ROUTE_LOCALITY ?? "Kalaikunda",
    labelPrefix: process.env.DEMO_ROUTE_BIN_LABEL_PREFIX ?? "BIN-DEMO",
    routeName: process.env.DEMO_ROUTE_NAME ?? "Kalaikunda",
  };
}

/** Five bins: SW → SE → NE → NW → center (truck visits in this order). */
export function buildRectangleBinPlacements(config: DemoRectangleConfig): DemoBinPlacement[] {
  const { centerLat, centerLng, latSpan, lngSpan, labelPrefix } = config;
  const p = labelPrefix;

  return [
    {
      label: `${p}-01`,
      latitude: centerLat - latSpan,
      longitude: centerLng - lngSpan,
      corner: "SW",
      fillLevel: 35,
      status: "filling",
      binType: "general",
    },
    {
      label: `${p}-02`,
      latitude: centerLat - latSpan,
      longitude: centerLng + lngSpan,
      corner: "SE",
      fillLevel: 52,
      status: "filling",
      binType: "organic",
    },
    {
      label: `${p}-03`,
      latitude: centerLat + latSpan,
      longitude: centerLng + lngSpan,
      corner: "NE",
      fillLevel: 68,
      status: "filling",
      binType: "recyclable",
    },
    {
      label: `${p}-04`,
      latitude: centerLat + latSpan,
      longitude: centerLng - lngSpan,
      corner: "NW",
      fillLevel: 81,
      status: "full",
      binType: "general",
    },
    {
      label: `${p}-05`,
      latitude: centerLat,
      longitude: centerLng,
      corner: "CENTER",
      fillLevel: 44,
      status: "filling",
      binType: "organic",
    },
  ];
}

export function getDemoBinLabelPrefix(): string {
  return process.env.DEMO_ROUTE_BIN_LABEL_PREFIX ?? "BIN-DEMO";
}

export function isDemoBinLabel(label: string, prefix = getDemoBinLabelPrefix()) {
  return label.startsWith(`${prefix}-`);
}
