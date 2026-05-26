import type { Map as MapboxMap } from "mapbox-gl";

/** Standard street map (override via NEXT_PUBLIC_MAP_STYLE). */
export const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ?? "mapbox://styles/mapbox/streets-v12";

/** Oblique 3D camera for live tracking maps. */
export const MAP_3D_VIEW = {
  pitch: 58,
  bearing: -28,
  zoom: 15,
} as const;

const TERRAIN_SOURCE_ID = "mapbox-dem";
const BUILDINGS_LAYER_ID = "afs-3d-buildings";

/** Adds elevation mesh + extruded buildings (call after style loads). Never throws — map stays usable if 3D extras fail. */
export function enhanceMapbox3D(map: MapboxMap) {
  try {
    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
    }

    map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.35 });

    if (!map.getLayer(BUILDINGS_LAYER_ID)) {
      const layers = map.getStyle()?.layers ?? [];
      const labelLayerId = layers.find(
        (layer) => layer.type === "symbol" && layer.layout && "text-field" in layer.layout,
      )?.id;

      map.addLayer(
        {
          id: BUILDINGS_LAYER_ID,
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": "#0f172a",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.72,
          },
        },
        labelLayerId,
      );
    }

    map.setFog({
      color: "rgb(186, 210, 235)",
      "high-color": "rgb(36, 92, 223)",
      "horizon-blend": 0.04,
      "space-color": "rgb(11, 11, 25)",
      "star-intensity": 0.35,
    });
  } catch (err) {
    console.warn("[mapbox] 3D enhancements skipped:", err);
  }
}

export function withMap3DView(view: {
  latitude: number;
  longitude: number;
  zoom?: number;
  pitch?: number;
  bearing?: number;
}) {
  return {
    ...view,
    zoom: view.zoom ?? MAP_3D_VIEW.zoom,
    pitch: MAP_3D_VIEW.pitch,
    bearing: MAP_3D_VIEW.bearing,
  };
}
