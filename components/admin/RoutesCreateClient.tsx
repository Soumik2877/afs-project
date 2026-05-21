"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouteOptimizer } from "@/hooks/useRouteOptimizer";
import { createClient } from "@/lib/supabase/client";
import type { BinRow, UserRow } from "@/types";

interface RoutesCreateClientProps {
  bins: BinRow[];
  drivers: UserRow[];
  adminId: string;
}

export function RoutesCreateClient({ bins, drivers, adminId }: RoutesCreateClientProps) {
  const client = useMemo(() => createClient(), []);
  const optimize = useRouteOptimizer();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(binId: string) {
    setSelected((previous) => {
      const clone = new Set(previous);
      if (clone.has(binId)) clone.delete(binId);
      else clone.add(binId);
      return clone;
    });
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-[#1F2937] bg-[#111827] p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const orderedBins = bins.filter((b) => selected.has(b.id));
        let binIds = orderedBins.map((b) => b.id);
        try {
          const optimized = await optimize(orderedBins);
          if (optimized.length) binIds = optimized;
        } catch {
          /* falls back */
        }

        const { error } = await client.from("routes").insert({
          name: form.get("name"),
          assigned_driver_id: form.get("driver"),
          vehicle_number: form.get("vehicle"),
          shift_date: form.get("shift"),
          bin_ids: binIds,
          status: "pending",
          created_by: adminId,
        });

        if (error) toast.error(error.message);
        else toast.success("Route drafted");
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Route name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          <Input id="vehicle" name="vehicle" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shift">Shift date</Label>
          <Input id="shift" name="shift" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="driver">Driver</Label>
          <select id="driver" name="driver" className="w-full rounded-lg border border-[#1F2937] bg-[#0A0F1E] px-3 py-2 text-sm">
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name ?? driver.id.slice(0, 6)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.35em] text-[#6B7280]">Select bins</p>
        <div className="grid max-h-64 grid-cols-2 gap-2 overflow-auto md:grid-cols-3">
          {bins.map((bin) => (
            <label key={bin.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#1F2937] bg-[#0A0F1E] p-2 text-xs">
              <input type="checkbox" checked={selected.has(bin.id)} onChange={() => toggle(bin.id)} />
              {bin.label}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit">Save optimized route</Button>
    </form>
  );
}
