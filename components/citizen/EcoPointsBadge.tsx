"use client";

import { cn } from "@/lib/utils";

interface EcoPointsBadgeProps {
  points: number;
  className?: string;
}

export function EcoPointsBadge({ points, className }: EcoPointsBadgeProps) {
  return (
    <div className={cn("rounded-xl border border-emerald-700/70 bg-emerald-900/35 px-4 py-3 text-emerald-200 shadow-[0_0_40px_-15px_rgb(74,222,128)]", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.45em]">Eco-score</span>
      <span className="ml-4 font-mono text-2xl">{points}</span>
    </div>
  );
}
