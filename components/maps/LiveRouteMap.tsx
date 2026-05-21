"use client";

import { useEffect, useMemo, useRef } from "react";
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from "react-map-gl";

import { TruckGlbLayer } from "@/components/maps/TruckGlbLayer";
import { cn } from "@/lib/utils";
import { MAP_STYLE } from "@/lib/mapbox/config";
import { useDriverLocationStream } from "@/hooks/useDriverLocationStream";
import { useRealtimeBins } from "@/hooks/useRealtimeBins";
import { useSmoothMapPosition } from "@/hooks/useSmoothMapPosition";
import type { BinRow, DriverLocationRow } from "@/types";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface LiveRouteMapProps {
  bins: BinRow[];
  binOrder: string[];
  driverId: string;
  routeId: string;
  driverName?: string | null;
  initialDriverLocation: DriverLocationRow | null;
  collectedBinIds?: string[];
  heightClass?: string;
}

function binMarkerColor(bin: BinRow, collected: boolean, isNext: boolean) {
  if (collected || bin.status === "empty" || bin.fill_level === 0) {
    return { bg: "#64748B", ring: isNext ? "ring-white/50" : "" };
  }
  if (bin.fill_level >= 80) return { bg: "#EF4444", ring: isNext ? "ring-amber-400 animate-pulse" : "" };
  if (bin.fill_level >= 50) return { bg: "#F59E0B", ring: isNext ? "ring-amber-400 animate-pulse" : "" };
  return { bg: "#10B981", ring: isNext ? "ring-emerald-300 animate-pulse" : "" };
}

export default function LiveRouteMap({
  bins,
  binOrder,
  driverId,
  routeId,
  driverName,
  initialDriverLocation,
  collectedBinIds = [],
  heightClass = "h-[min(70vh,640px)]",
}: LiveRouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const lastServerPingRef = useRef<string | null>(null);
  const collectedSet = useMemo(() => new Set(collectedBinIds), [collectedBinIds]);

  const { bins: liveBins } = useRealtimeBins(bins);
  const driverLocation = useDriverLocationStream(driverId, initialDriverLocation);

  const smoothTarget = useMemo(
    () =>
      driverLocation
        ? { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
        : null,
    [driverLocation],
  );

  const smoothTruck = useSmoothMapPosition(smoothTarget, driverLocation?.updated_at);

  const orderedBins = useMemo(() => {
    return [...liveBins].sort((a, b) => binOrder.indexOf(a.id) - binOrder.indexOf(b.id));
  }, [liveBins, binOrder]);

  const nextBinId = useMemo(() => {
    return orderedBins.find((bin) => !collectedSet.has(bin.id) && bin.status !== "empty")?.id ?? null;
  }, [orderedBins, collectedSet]);

  const routeLine = useMemo(() => {
    const coordinates = orderedBins.map((bin) => [bin.longitude, bin.latitude] as [number, number]);

    if (smoothTruck) {
      coordinates.push([smoothTruck.longitude, smoothTruck.latitude]);
    }

    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates,
      },
    };
  }, [orderedBins, smoothTruck]);

  const initialView = useMemo(() => {
    const focus = smoothTruck ?? driverLocation ?? orderedBins[0];
    if (!focus) {
      return { latitude: 12.9716, longitude: 77.5946, zoom: 12 };
    }
    return {
      latitude: focus.latitude,
      longitude: focus.longitude,
      zoom: 13,
    };
  }, [smoothTruck, driverLocation, orderedBins]);

  useEffect(() => {
    if (!driverLocation || !mapRef.current) return;
    if (lastServerPingRef.current === driverLocation.updated_at) return;

    lastServerPingRef.current = driverLocation.updated_at;
    mapRef.current.easeTo({
      center: [driverLocation.longitude, driverLocation.latitude],
      duration: 1200,
      easing: (t) => t * (2 - t),
      essential: true,
    });
  }, [driverLocation]);

  if (!token) {
    return (
      <div className={cn("rounded-xl border border-amber-500/40 bg-amber-950/30 p-6 text-sm text-amber-100", heightClass)}>
        Set NEXT_PUBLIC_MAPBOX_TOKEN for live route tracking.
      </div>
    );
  }

  const collectedCount = orderedBins.filter(
    (bin) => collectedSet.has(bin.id) || bin.status === "empty" || bin.fill_level === 0,
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#64748B]">Live collection</p>
          <p className="font-semibold text-white">{driverName ?? "Driver"} · {routeId.slice(0, 8)}…</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-emerald-300">
            {collectedCount}/{orderedBins.length} bins
          </p>
          <p className="text-xs text-[#94A3B8]">
            {smoothTruck?.isMoving ? "3D truck · smooth GPS" : "3D truck idle"}
            {driverName ? ` · ${driverName}` : ""}
          </p>
        </div>
      </div>

      <div className={cn("overflow-hidden rounded-xl border border-[#1F2937]", heightClass)}>
        <Map
          ref={mapRef}
          initialViewState={initialView}
          mapStyle={MAP_STYLE}
          mapboxAccessToken={token}
          style={{ width: "100%", height: "100%" }}
          renderWorldCopies={false}
        >
          <NavigationControl position="top-right" />

          <Source id={`route-line-${routeId}`} type="geojson" data={routeLine}>
            <Layer
              id={`route-line-layer-${routeId}`}
              type="line"
              paint={{
                "line-color": "#10B981",
                "line-width": 4,
                "line-opacity": 0.85,
                "line-dasharray": [2, 1],
              }}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>

          {orderedBins.map((bin) => {
            const collected =
              collectedSet.has(bin.id) || bin.status === "empty" || (bin.fill_level === 0 && bin.status !== "filling");
            const isNext = bin.id === nextBinId;
            const colors = binMarkerColor(bin, collected, isNext);

            return (
              <Marker key={bin.id} latitude={bin.latitude} longitude={bin.longitude} anchor="bottom">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0A0F1E] text-[10px] font-bold text-white shadow-lg transition-colors duration-500",
                    colors.ring,
                    collected ? "opacity-60" : "",
                  )}
                  style={{ backgroundColor: colors.bg }}
                  title={bin.label}
                >
                  {collected ? "✓" : bin.fill_level}
                </div>
              </Marker>
            );
          })}

          {smoothTruck ? (
            <TruckGlbLayer
              latitude={smoothTruck.latitude}
              longitude={smoothTruck.longitude}
              bearing={smoothTruck.bearing}
            />
          ) : null}
        </Map>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[#94A3B8]">
        <span className="flex items-center gap-2">
          <span className="h-3 w-5 rounded-sm bg-gradient-to-b from-emerald-400 to-emerald-600 shadow" /> Live truck
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-500" /> Collected / empty
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-300" /> Next stop
        </span>
      </div>
    </div>
  );
}
