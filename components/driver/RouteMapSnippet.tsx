"use client";

import Map, { Marker, NavigationControl } from "react-map-gl";

import type { BinRow } from "@/types";

import { MAP_3D_VIEW, MAP_STYLE, withMap3DView } from "@/lib/mapbox/config";
import { Map3DSetup } from "@/components/maps/Map3DSetup";

interface RouteMapSnippetProps {
  bins: BinRow[];
  focus?: BinRow;
}

export default function RouteMapSnippet({ bins, focus }: RouteMapSnippetProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-100">Mapbox token missing</div>;
  }

  const center = focus ?? bins[0];

  if (!center) {
    return null;
  }

  return (
    <div className="h-[240px] overflow-hidden rounded-2xl border border-[#1F2937]">
      <Map
        initialViewState={withMap3DView({
          latitude: center.latitude,
          longitude: center.longitude,
          zoom: MAP_3D_VIEW.zoom,
        })}
        mapboxAccessToken={token}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" visualizePitch />
        <Map3DSetup />
        {bins.map((bin) => (
          <Marker key={bin.id} latitude={bin.latitude} longitude={bin.longitude}>
            <div
              className={
                bin.id === focus?.id
                  ? "h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_35px_-5px_rgb(74,222,128)]"
                  : "h-3 w-3 rounded-full bg-slate-600"
              }
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
