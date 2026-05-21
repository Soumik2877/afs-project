"use client";

import type { PropsWithChildren } from "react";

import { Badge } from "@/components/ui/badge";
import type { RouteRow } from "@/types";

interface RouteCardProps extends PropsWithChildren {
  route: RouteRow;
}

export function RouteCard({ route, children }: RouteCardProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-[#142033] bg-gradient-to-br from-[#0d1427] via-[#0A0F1E] to-[#050913] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-[#475569]">Manifest</p>
          <h2 className="font-display text-3xl text-white">{route.name}</h2>
          <p className="text-sm text-[#94A3B8]">{route.shift_date}</p>
        </div>
        <Badge variant={route.status === "active" ? "success" : "neutral"}>{route.status}</Badge>
      </div>
      <p className="text-sm text-[#CBD5F5]">
        Serving {route.bin_ids?.length ?? 0} smart bins • Vehicle {route.vehicle_number ?? "—"}
      </p>
      {children}
    </div>
  );
}
