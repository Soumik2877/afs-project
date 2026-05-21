"use client";

import { Progress } from "@/components/ui/progress";
import type { BinRow } from "@/types";

interface CollectionProgressProps {
  bins: BinRow[];
}

export function CollectionProgress({ bins }: CollectionProgressProps) {
  const fullness = bins.length ? bins.reduce((sum, bin) => sum + bin.fill_level, 0) / bins.length / 100 : 0;

  return (
    <div className="space-y-2 rounded-xl border border-[#1F2937] bg-[#0F172A] p-6">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-[#94A3B8]">
        <span>Fleet fullness</span>
        <span className="text-white">{bins.length}</span>
      </div>
      <Progress value={Math.round(fullness * 100)} />
      <p className="text-xs text-[#6B7280]">{Math.round(fullness * 100)}% average fill across networked bins.</p>
    </div>
  );
}
