"use client";

import { useEffect, useMemo, useRef } from "react";
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from "react-map-gl";

import { DriverRadarMarker } from "@/components/maps/DriverRadarMarker";
import { cn } from "@/lib/utils";
import {
  buildRouteSegmentCollection,
  routeLinePaintAhead,
  routeLinePaintCovered,
} from "@/lib/mapbox/route-segments";
import { MAP_STYLE } from "@/lib/mapbox/config";
import { useRealtimeBins } from "@/hooks/useRealtimeBins";
import { useSmoothMapPosition } from "@/hooks/useSmoothMapPosition";
import type { BinRow, CitizenPickupRequestRow, DriverLocationRow } from "@/types";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface LiveRouteMapProps {
  bins: BinRow[];
  binOrder: string[];
  routeId: string;
  driverName?: string | null;
  driverLocation: DriverLocationRow | null;
  collectedBinIds?: string[];
  citizenPickup?: CitizenPickupRequestRow | null;
  heightClass?: string;
}

function parseCoord(lat: unknown, lng: unknown) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }
  return { lat: latitude, lng: longitude };
}

function binCoords(bin: BinRow) {
  return parseCoord(bin.latitude, bin.longitude);
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
  routeId,
  driverName,
  driverLocation,
  collectedBinIds = [],
  citizenPickup = null,
  heightClass = "h-[min(70vh,640px)]",
}: LiveRouteMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const lastServerPingRef = useRef<string | null>(null);
  const didFitBoundsRef = useRef(false);
  const collectedSet = useMemo(() => new Set(collectedBinIds), [collectedBinIds]);

  const { bins: liveBins } = useRealtimeBins(bins);

  const smoothTarget = useMemo(() => {
    if (!driverLocation) return null;
    const lat = Number(driverLocation.latitude);
    const lng = Number(driverLocation.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { latitude: lat, longitude: lng };
  }, [driverLocation]);

  const smoothTruck = useSmoothMapPosition(smoothTarget, driverLocation?.updated_at);

  const citizenDetourLine = useMemo(() => {
    if (!citizenPickup || !["pending", "en_route", "arrived"].includes(citizenPickup.status)) {
      return null;
    }

    const truck = smoothTruck ?? driverLocation;
    const citizenCoord: [number, number] = [citizenPickup.longitude, citizenPickup.latitude];

    const coordinates: [number, number][] = truck
      ? [[truck.longitude, truck.latitude], citizenCoord]
      : [citizenCoord];

    return {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates },
    };
  }, [citizenPickup, smoothTruck, driverLocation]);

  const orderedBins = useMemo(() => {
    return [...liveBins].sort((a, b) => binOrder.indexOf(a.id) - binOrder.indexOf(b.id));
  }, [liveBins, binOrder]);

  const nextBinId = useMemo(() => {
    return orderedBins.find((bin) => !collectedSet.has(bin.id) && bin.status !== "empty")?.id ?? null;
  }, [orderedBins, collectedSet]);

  const routeSegments = useMemo(
    () =>
      buildRouteSegmentCollection(
        orderedBins,
        collectedSet,
        smoothTruck ? { latitude: smoothTruck.latitude, longitude: smoothTruck.longitude } : null,
      ),
    [orderedBins, collectedSet, smoothTruck],
  );

  const initialView = useMemo(() => {
    const focus = smoothTruck ?? driverLocation ?? orderedBins[0];
    if (!focus) {
      return { latitude: 12.9716, longitude: 77.5946, zoom: 12, pitch: 0, bearing: 0 };
    }
    return {
      latitude: focus.latitude,
      longitude: focus.longitude,
      zoom: 15,
      pitch: 0,
      bearing: 0,
    };
  }, [smoothTruck, driverLocation, orderedBins]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || didFitBoundsRef.current || orderedBins.length === 0) return;

    const fit = () => {
      if (didFitBoundsRef.current) return;

      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      for (const bin of orderedBins) {
        const coord = binCoords(bin);
        if (!coord) continue;
        minLng = Math.min(minLng, coord.lng);
        minLat = Math.min(minLat, coord.lat);
        maxLng = Math.max(maxLng, coord.lng);
        maxLat = Math.max(maxLat, coord.lat);
      }

      if (driverLocation) {
        const lat = Number(driverLocation.latitude);
        const lng = Number(driverLocation.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          minLng = Math.min(minLng, lng);
          minLat = Math.min(minLat, lat);
          maxLng = Math.max(maxLng, lng);
          maxLat = Math.max(maxLat, lat);
        }
      }

      if (!Number.isFinite(minLng)) return;

      didFitBoundsRef.current = true;
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 72, duration: 800, maxZoom: 16 },
      );
    };

    if (map.isStyleLoaded()) {
      fit();
    } else {
      map.once("load", fit);
    }
  }, [driverLocation, orderedBins]);

  useEffect(() => {
    if (!driverLocation || !mapRef.current || !didFitBoundsRef.current) return;
    if (lastServerPingRef.current === driverLocation.updated_at) return;

    lastServerPingRef.current = driverLocation.updated_at;
    mapRef.current.easeTo({
      center: [driverLocation.longitude, driverLocation.latitude],
      zoom: 15,
      pitch: 0,
      bearing: 0,
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
            {smoothTruck?.isMoving ? "Live radar · smooth GPS" : "Live radar idle"}
            {driverName ? ` · ${driverName}` : ""}
          </p>
        </div>
      </div>

      <div className={cn("relative min-h-[320px] overflow-hidden rounded-xl border border-[#1F2937]", heightClass)}>
        <Map
          ref={mapRef}
          initialViewState={initialView}
          mapStyle={MAP_STYLE}
          mapboxAccessToken={token}
          style={{ width: "100%", height: "100%", minHeight: 320 }}
          renderWorldCopies={false}
        >
          <NavigationControl position="top-right" />

          <Source id={`route-line-${routeId}`} type="geojson" data={routeSegments}>
            <Layer
              id={`route-line-covered-${routeId}`}
              type="line"
              filter={["==", ["get", "covered"], true]}
              paint={routeLinePaintCovered}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
            <Layer
              id={`route-line-ahead-${routeId}`}
              type="line"
              filter={["==", ["get", "covered"], false]}
              paint={routeLinePaintAhead}
              layout={{ "line-cap": "round", "line-join": "round" }}
            />
          </Source>

          {citizenDetourLine ? (
            <Source id={`citizen-detour-${routeId}`} type="geojson" data={citizenDetourLine}>
              <Layer
                id={`citizen-detour-layer-${routeId}`}
                type="line"
                paint={{
                  "line-color": "#38BDF8",
                  "line-width": 4,
                  "line-opacity": 1,
                  "line-emissive-strength": 1,
                  "line-dasharray": [2, 1.5],
                }}
                layout={{
                  "line-cap": "round",
                  "line-join": "round",
                }}
              />
            </Source>
          ) : null}

          {orderedBins.map((bin) => {
            const coord = binCoords(bin);
            if (!coord) return null;

            const collected =
              collectedSet.has(bin.id) || bin.status === "empty" || (bin.fill_level === 0 && bin.status !== "filling");
            const isNext = bin.id === nextBinId;
            const colors = binMarkerColor(bin, collected, isNext);

            return (
              <Marker key={bin.id} latitude={coord.lat} longitude={coord.lng} anchor="bottom">
                <div
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white text-[11px] font-bold text-white shadow-[0_0_0_2px_rgba(0,0,0,0.65),0_4px_14px_rgba(0,0,0,0.45)] transition-colors duration-500",
                    colors.ring,
                    collected ? "opacity-80" : "",
                  )}
                  style={{ backgroundColor: colors.bg, zIndex: 10 }}
                  title={bin.label}
                >
                  {collected ? "✓" : bin.fill_level}
                </div>
              </Marker>
            );
          })}

          {citizenPickup &&
          ["pending", "en_route", "arrived"].includes(citizenPickup.status) &&
          parseCoord(citizenPickup.latitude, citizenPickup.longitude) ? (
            <Marker
              latitude={Number(citizenPickup.latitude)}
              longitude={Number(citizenPickup.longitude)}
              anchor="bottom"
            >
              <div
                className={cn(
                  "flex flex-col items-center",
                  citizenPickup.status === "arrived" && "animate-pulse",
                )}
              >
                <div className="rounded-full border-2 border-sky-300 bg-sky-500 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                  Your pickup
                </div>
                <div className="mt-0.5 h-3 w-3 rotate-45 border-2 border-white bg-sky-400" />
              </div>
            </Marker>
          ) : null}

          {smoothTruck && Number.isFinite(smoothTruck.latitude) && Number.isFinite(smoothTruck.longitude) ? (
            <Marker latitude={smoothTruck.latitude} longitude={smoothTruck.longitude} anchor="center">
              <DriverRadarMarker bearing={smoothTruck.bearing} isMoving={smoothTruck.isMoving} />
            </Marker>
          ) : null}
        </Map>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[#94A3B8]">
        <span className="flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-emerald-500" /> Route ahead
        </span>
        <span className="flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-orange-500" /> Covered
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-0 w-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-emerald-500" /> Live driver
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
