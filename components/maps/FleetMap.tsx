"use client";

import { useMemo } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";

import { cn } from "@/lib/utils";
import { MAP_3D_VIEW, MAP_STYLE, withMap3DView } from "@/lib/mapbox/config";
import { Map3DSetup } from "@/components/maps/Map3DSetup";
import type { DriverLocationRow, UserRow } from "@/types";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface FleetDot extends DriverLocationRow {
  meta?: Partial<UserRow> & { anomaly?: boolean; status?: string };
}

interface FleetMapProps {
  drivers: FleetDot[];
  heightClass?: string;
}

export default function FleetMap({ drivers, heightClass = "h-[calc(100vh-140px)]" }: FleetMapProps) {
  const view = useMemo(() => {
    if (!drivers.length) {
      return withMap3DView({
        latitude: Number(process.env.NEXT_PUBLIC_DEMO_ROUTE_CENTER_LAT ?? 22.333298),
        longitude: Number(process.env.NEXT_PUBLIC_DEMO_ROUTE_CENTER_LNG ?? 87.222896),
        zoom: 14,
      });
    }

    const lat = drivers.reduce((sum, d) => sum + d.latitude, 0) / drivers.length || drivers[0]!.latitude;
    const lng = drivers.reduce((sum, d) => sum + d.longitude, 0) / drivers.length || drivers[0]!.longitude;

    return withMap3DView({ latitude: lat, longitude: lng, zoom: MAP_3D_VIEW.zoom });
  }, [drivers]);

  if (!token) {
    return (
      <div
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-100",
          heightClass,
        )}
      >
        Fleet routing requires NEXT_PUBLIC_MAPBOX_TOKEN.
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#1F2937]", heightClass)}>
      <Map initialViewState={view} mapStyle={MAP_STYLE} mapboxAccessToken={token} style={{ width: "100%", height: "100%" }}>
        <NavigationControl position="top-right" visualizePitch />
        <Map3DSetup />
        {drivers.map((driverLocation) => {
          const hue = driverLocation.meta?.anomaly ? "#EF4444" : driverLocation.meta?.status === "idle" ? "#9CA3AF" : "#10B981";

          return (
            <Marker
              key={driverLocation.id}
              latitude={driverLocation.latitude}
              longitude={driverLocation.longitude}
            >
              <div
                className="grid h-4 w-4 place-items-center rounded-full border-2 border-white text-[10px] font-semibold uppercase text-transparent"
                style={{ backgroundColor: hue }}
                title={`${driverLocation.meta?.full_name ?? "Driver"} — ${hue === "#EF4444" ? "Anomaly" : "On route"}`}
              />
              <span className="sr-only">{driverLocation.driver_id}</span>
            </Marker>
          );
        })}
      </Map>
      <footer className="flex flex-wrap gap-4 border-t border-[#1F2937] bg-black/70 px-4 py-3 text-xs text-[#9CA3AF]">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> On route
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#9CA3AF]" /> Idle
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Anomaly
        </span>
      </footer>
    </div>
  );
}
