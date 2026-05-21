"use client";

import { cn } from "@/lib/utils";
import { useRealtimeBins } from "@/hooks/useRealtimeBins";
import type { BinRow } from "@/types";

interface AdminBinGridProps {
  seed: BinRow[];
}

export function AdminBinGrid({ seed }: AdminBinGridProps) {
  const { bins } = useRealtimeBins(seed);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Live bin grid</h2>
        <p className="text-xs uppercase tracking-[0.5em] text-[#475569]">Realtime · bins</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {bins.map((bin) => (
          <div
            key={bin.id}
            className={cn(
              "rounded-xl border px-5 py-4 backdrop-blur",
              bin.fill_level >= 80
                ? "border-red-700/70 bg-[#381219]"
                : bin.fill_level >= 50
                  ? "border-amber-700/70 bg-[#301d08]"
                  : "border-emerald-800/70 bg-[#0f2218]",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.4em] text-[#CBD5F5]">{bin.label}</p>
                <p className="text-xl font-semibold text-white">{bin.fill_level}%</p>
                <p className="text-[11px] uppercase tracking-[0.45em] text-[#64748b]">{bin.locality}</p>
              </div>
              <div className="text-right">
                <p className={bin.fill_level >= 80 ? "animate-pulse text-[10px] text-red-200" : "text-[10px] text-[#6B7280]"}>
                  STATUS
                </p>
                <span className="text-sm capitalize text-emerald-200">{bin.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {bins.length === 0 ? <p className="text-sm text-[#64748b]">No bins registered.</p> : null}
    </div>
  );
}
