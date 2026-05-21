"use client";

import Map, { Marker, NavigationControl } from "react-map-gl";

import { MAP_STYLE } from "@/lib/mapbox/config";
import { cn } from "@/lib/utils";
import type { DriverLocationRow } from "@/types";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface CitizenTrackMapProps {
  driver?: DriverLocationRow | null;
  citizenLatLng?: { latitude: number; longitude: number } | null;
  etaMinutes?: number;
  heightClass?: string;
}

export default function CitizenTrackMap({
  driver,
  citizenLatLng,
  etaMinutes,
  heightClass = "h-[520px]",
}: CitizenTrackMapProps) {
  if (!token) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-amber-400/40 bg-[#111827] p-8 text-center text-sm text-amber-100",
          heightClass,
        )}
      >
        Map previews require NEXT_PUBLIC_MAPBOX_TOKEN.
      </div>
    );
  }

  const focus = citizenLatLng ?? {
    latitude: driver?.latitude ?? 12.96,
    longitude: driver?.longitude ?? 77.59,
  };

  return (
    <div className={cn("space-y-4", heightClass)}>
      {typeof etaMinutes === "number" ? (
        <div className="animate-slideIn rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 shadow-[0_10px_50px_-20px_rgb(34,211,238)] backdrop-blur">
          Collection ETA ≈{" "}
          <span className="font-mono text-lg font-semibold text-white">
            {etaMinutes <= 5 ? "~ now" : `~ ${etaMinutes} min`}
          </span>
        </div>
      ) : null}
      <div className={cn("overflow-hidden rounded-2xl border border-[#1F2937]", heightClass)}>
        <Map
          initialViewState={{
            latitude: focus.latitude,
            longitude: focus.longitude,
            zoom: driver ? 14 : 13,
          }}
          mapStyle={MAP_STYLE}
          mapboxAccessToken={token}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="bottom-right" />
          {citizenLatLng ? <Marker latitude={citizenLatLng.latitude} longitude={citizenLatLng.longitude} /> : null}
          {driver ? (
            <Marker latitude={driver.latitude} longitude={driver.longitude} anchor="bottom" />
          ) : null}
        </Map>
      </div>
    </div>
  );
}
