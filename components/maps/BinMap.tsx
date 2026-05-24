"use client";

import Link from "next/link";
import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";

import { cn } from "@/lib/utils";

import { MAP_3D_VIEW, MAP_STYLE, withMap3DView } from "@/lib/mapbox/config";
import { Map3DSetup } from "@/components/maps/Map3DSetup";
import type { BinRow } from "@/types";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface BinMapProps {
  bins: BinRow[];
  onSelectBin?: (bin: BinRow) => void;
  heightClass?: string;
  enableClickToAdd?: (coords: [number, number]) => void;
}

export default function BinMap({ bins, onSelectBin, heightClass = "h-[calc(100vh-160px)]", enableClickToAdd }: BinMapProps) {
  const initialView = useMemo(() => {
    if (!bins.length) {
      return { latitude: 20.5937, longitude: 78.9629, zoom: 5 };
    }

    const averageLat =
      bins.reduce((sum, bin) => sum + bin.latitude, 0) /
      bins.length || bins[0]!.latitude;

    const averageLng =
      bins.reduce((sum, bin) => sum + bin.longitude, 0) /
      bins.length || bins[0]!.longitude;

    return withMap3DView({ latitude: averageLat, longitude: averageLng, zoom: MAP_3D_VIEW.zoom });
  }, [bins]);

  if (!token) {
    return (
      <div className={`flex flex-col gap-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-100 ${heightClass}`}>
        Provide <span className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</span> to visualize bins.
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#1F2937]", heightClass)}>
      <Map
        initialViewState={initialView}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={token}
        style={{ width: "100%", height: "100%" }}
        onClick={(event) => {
          if (enableClickToAdd) {
            enableClickToAdd([event.lngLat.lng, event.lngLat.lat]);
          }
        }}
      >
        <NavigationControl position="top-right" visualizePitch />
        <Map3DSetup />
        {bins.map((bin) => {
          const color =
            bin.fill_level >= 80
              ? "#EF4444"
              : bin.fill_level >= 50
                ? "#F59E0B"
                : "#10B981";

          return (
            <Marker
              key={bin.id}
              latitude={bin.latitude}
              longitude={bin.longitude}
              anchor="bottom"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                onSelectBin?.(bin);
              }}
            >
              <div
                className={cn(
                  "flex h-8 w-8 -translate-y-1 items-center justify-center rounded-full border border-[#0A0F1E] text-[10px] font-bold shadow-lg",
                  bin.fill_level >= 80 ? "animate-pulseMarker bg-red-600 text-white" : "bg-black/70 text-emerald-200",
                )}
                style={{ backgroundColor: color }}
              >
                {bin.fill_level}
              </div>
              <div className="sr-only">{bin.label}</div>
            </Marker>
          );
        })}
      </Map>
      <div className="flex gap-4 border-t border-[#1F2937] bg-black/60 px-4 py-3 text-[11px] text-[#9CA3AF]">
        Legend:
        <span className="text-emerald-400">Healthy</span>
        <span className="text-amber-300">Attention</span>
        <span className="text-red-400 flex items-center gap-1">
          Critical <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
        </span>
        <Link className="ml-auto text-[#3B82F6]" href="/admin/fleet">
          Live Fleet
        </Link>
      </div>
    </div>
  );
}
