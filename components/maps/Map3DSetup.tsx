"use client";

import { useEffect } from "react";
import { useMap } from "react-map-gl";

import { enhanceMapbox3D } from "@/lib/mapbox/config";

/** Enables terrain + 3D buildings once the Mapbox style is ready. */
export function Map3DSetup() {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map) return;

    const apply = () => enhanceMapbox3D(map);

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("style.load", apply);
    }

    map.on("style.load", apply);
    return () => {
      map.off("style.load", apply);
    };
  }, [mapRef]);

  return null;
}
