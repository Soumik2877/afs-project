"use client";

import { useEffect, useRef, useState } from "react";

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

interface SmoothPosition extends MapCoordinate {
  bearing: number;
  isMoving: boolean;
}

const DEFAULT_SEGMENT_MS = 10_000;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpAngle(from: number, to: number, t: number) {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * t + 360) % 360;
}

/** Bearing in degrees (0 = north, clockwise) for map-aligned rotation. */
export function bearingDegrees(from: MapCoordinate, to: MapCoordinate) {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function segmentDurationMs(
  from: MapCoordinate,
  to: MapCoordinate,
  serverUpdatedAt?: string,
  previousServerAt?: string,
) {
  if (serverUpdatedAt && previousServerAt) {
    const delta = Date.parse(serverUpdatedAt) - Date.parse(previousServerAt);
    if (delta > 500 && delta < 120_000) return delta;
  }

  const env = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_DRIVER_ANIMATION_MS : undefined;
  if (env) {
    const parsed = Number(env);
    if (Number.isFinite(parsed) && parsed > 500) return parsed;
  }

  const pollMs = Number(process.env.NEXT_PUBLIC_DRIVER_LOCATION_POLL_MS ?? 3000);
  if (Number.isFinite(pollMs) && pollMs > 500) return pollMs;

  const latDiff = Math.abs(to.latitude - from.latitude);
  const lngDiff = Math.abs(to.longitude - from.longitude);
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  return Math.max(3_000, Math.min(DEFAULT_SEGMENT_MS, distance * 800_000));
}

/**
 * Interpolates sparse GPS pings into 60fps-smooth map coordinates via requestAnimationFrame.
 */
export function useSmoothMapPosition(target: MapCoordinate | null, updatedAt?: string | null) {
  const [smooth, setSmooth] = useState<SmoothPosition | null>(
    target
      ? { ...target, bearing: 0, isMoving: false }
      : null,
  );

  const displayRef = useRef<MapCoordinate | null>(target ? { ...target } : null);
  const segmentRef = useRef({
    from: null as MapCoordinate | null,
    to: null as MapCoordinate | null,
    startMs: 0,
    durationMs: DEFAULT_SEGMENT_MS,
    bearing: 0,
  });
  const lastServerAtRef = useRef<string | null>(updatedAt ?? null);
  const bearingRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!target) {
      displayRef.current = null;
      setSmooth(null);
      return;
    }

    const prev = displayRef.current ?? target;
    const next = { latitude: target.latitude, longitude: target.longitude };

    const jumped =
      Math.abs(prev.latitude - next.latitude) > 0.000001 ||
      Math.abs(prev.longitude - next.longitude) > 0.000001;

    const serverTick = updatedAt != null && updatedAt !== lastServerAtRef.current;

    if (!jumped && !serverTick && displayRef.current) return;

    const durationMs = segmentDurationMs(
      prev,
      next,
      updatedAt ?? undefined,
      lastServerAtRef.current ?? undefined,
    );

    lastServerAtRef.current = updatedAt ?? null;

    const nextBearing = bearingDegrees(prev, next);

    segmentRef.current = {
      from: { ...prev },
      to: { ...next },
      startMs: performance.now(),
      durationMs,
      bearing: nextBearing,
    };

    if (displayRef.current) {
      bearingRef.current = lerpAngle(bearingRef.current, nextBearing, 0.35);
    } else {
      bearingRef.current = nextBearing;
    }

    if (!displayRef.current) {
      displayRef.current = { ...next };
      setSmooth({ ...next, bearing: segmentRef.current.bearing, isMoving: false });
    }
  }, [target, updatedAt]);

  useEffect(() => {
    const animate = (now: number) => {
      const seg = segmentRef.current;

      if (seg.from && seg.to) {
        const elapsed = now - seg.startMs;
        const rawT = Math.min(1, elapsed / seg.durationMs);
        const t = easeInOutCubic(rawT);

        const latitude = lerp(seg.from.latitude, seg.to.latitude, t);
        const longitude = lerp(seg.from.longitude, seg.to.longitude, t);

        displayRef.current = { latitude, longitude };

        bearingRef.current = lerpAngle(bearingRef.current, seg.bearing, rawT < 1 ? 0.12 : 1);

        setSmooth({
          latitude,
          longitude,
          bearing: bearingRef.current,
          isMoving: rawT < 0.995,
        });

        if (rawT >= 1) {
          seg.from = { latitude, longitude };
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return smooth;
}
