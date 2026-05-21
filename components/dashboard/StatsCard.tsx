"use client";

import * as React from "react";

import { Card } from "@/components/ui/card";

interface StatsCardProps {
  label: string;
  description?: string;
  value: number;
  suffix?: string;
}

export function StatsCard({ label, description, value, suffix }: StatsCardProps) {
  const [animated, setAnimated] = React.useState(0);

  React.useEffect(() => {
    const durationMs = 800;
    const start = performance.now();

    let frameId = 0;

    const animate = (time: number) => {
      const progress = Math.min((time - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimated(Math.round(eased * value));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return (
    <Card className="border-[#1F2937] bg-gradient-to-br from-[#0F172A] to-[#101b32] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-emerald-500/35">
      <div className="flex flex-col gap-2 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-[#6B7280]">{label}</p>
        <p className="font-display text-4xl font-semibold text-emerald-300 md:text-[2.85rem]" aria-live="polite">
          {animated}
          {suffix}
        </p>
        {description ? <p className="text-xs text-[#9CA3AF]">{description}</p> : null}
      </div>
    </Card>
  );
}
