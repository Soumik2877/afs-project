"use client";

import Map, { Marker, NavigationControl } from "react-map-gl";

import { MAP_STYLE } from "@/lib/mapbox/config";

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface ComplaintPinMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

export default function ComplaintPinMap({ latitude, longitude, onChange }: ComplaintPinMapProps) {
  if (!token) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-100">
        Add NEXT_PUBLIC_MAPBOX_TOKEN to drop complaint pins on the map.
      </div>
    );
  }

  return (
    <div className="h-64 overflow-hidden rounded-2xl border border-[#1F2937]">
      <Map
        initialViewState={{ latitude, longitude, zoom: 14 }}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={token}
        style={{ width: "100%", height: "100%" }}
        onClick={(event) => onChange(event.lngLat.lat, event.lngLat.lng)}
      >
        <NavigationControl position="top-right" />
        <Marker latitude={latitude} longitude={longitude} draggable onDragEnd={(event) => onChange(event.lngLat.lat, event.lngLat.lng)} />
      </Map>
    </div>
  );
}
