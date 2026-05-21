"use client";

import { useCallback } from "react";

import type { BinRow } from "@/types";

export function useRouteOptimizer() {
  return useCallback(
    async (bins: BinRow[], start?: { lng: number; lat: number }) => {
      const response = await fetch("/api/optimize-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bins: bins.map((bin) => ({
            id: bin.id,
            latitude: bin.latitude,
            longitude: bin.longitude,
          })),
          start,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.optimizedIds?.length) {
        return bins.map((bin) => bin.id);
      }

      return payload.optimizedIds as string[];
    },
    [],
  );
}
