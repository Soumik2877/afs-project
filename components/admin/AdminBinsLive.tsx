"use client";

import dynamic from "next/dynamic";

import { AdminBinsExplorer } from "@/components/admin/AdminBinsExplorer";
import { MapErrorBoundary } from "@/components/maps/MapErrorBoundary";
import { useRealtimeBins } from "@/hooks/useRealtimeBins";
import type { BinRow } from "@/types";

const BinMap = dynamic(() => import("@/components/maps/BinMap"), { ssr: false });

interface AdminBinsLiveProps {
  seed: BinRow[];
}

export function AdminBinsLive({ seed }: AdminBinsLiveProps) {
  const { bins } = useRealtimeBins(seed);

  return (
    <div className="grid gap-10 lg:grid-cols-[340px,1fr]">
      <AdminBinsExplorer bins={bins} />
      <div className="min-h-[620px] space-y-4">
        <p className="text-xs uppercase tracking-[0.45em] text-[#64748B]">Live map · bins</p>
        <MapErrorBoundary>
          <BinMap bins={bins} />
        </MapErrorBoundary>
      </div>
    </div>
  );
}
