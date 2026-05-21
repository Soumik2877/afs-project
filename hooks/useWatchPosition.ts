"use client";

import { useEffect, useState } from "react";

export function useWatchPosition(enabled: boolean, onReading: PositionCallback, onErr?: PositionErrorCallback) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "geolocation" in navigator);
  }, []);

  useEffect(() => {
    if (!supported || !enabled) return undefined;

    const watchId = navigator.geolocation.watchPosition(onReading, onErr, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
      timeout: 20_000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled, supported, onErr, onReading]);
}
