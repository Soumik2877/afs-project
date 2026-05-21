"use client";

import { useEffect, useState } from "react";

interface AnomalyState {
  id: string;
  reason: string;
  acknowledged: boolean;
  created_at: string;
}

export function useAnomalyTicker(enabled = true) {
  const [latest, setLatest] = useState<AnomalyState | null>(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();

    const execute = async () => {
      const response = await fetch("/api/anomaly-check", { signal: controller.signal });

      const json = await response.json();

      if (json?.anomaly?.id) {
        setLatest(json.anomaly as AnomalyState);
      }
    };

    void execute();
    const id = window.setInterval(() => void execute(), 120_000);

    return () => {
      controller.abort();
      window.clearInterval(id);
    };
  }, [enabled]);

  return latest;
}
