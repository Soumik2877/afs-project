"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { decompositionProgressPercent } from "@/lib/utils/decomposition";
import { createClient } from "@/lib/supabase/client";

import type { DecompositionBatchRow, FacilityCheckinRow } from "@/types";

type BatchHydrated = DecompositionBatchRow & {
  facility_checkins?:
    | (FacilityCheckinRow & {
        facility_name?: string;
        waste_type?: string;
      })
    | null;
};

interface DecompositionBoardProps {
  batches: BatchHydrated[];
}

export function DecompositionBoard({ batches }: DecompositionBoardProps) {
  const client = useMemo(() => createClient(), []);
  const [rows, setRows] = useState(batches);

  return (
    <div className="space-y-4">
      {rows.map((batch) => {
        const pct = decompositionProgressPercent(batch.deposited_at, batch.estimated_ready_at);

        return (
          <div key={batch.id} className="rounded-2xl border border-[#1F2937] bg-[#111827] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{batch.batch_label}</p>
                <p className="text-sm text-[#94A3B8]">{batch.facility_checkins?.facility_name}</p>
                <p className="text-xs uppercase tracking-[0.35em] text-[#475569]">
                  {batch.facility_checkins?.waste_type}
                </p>
              </div>
              <StatusBadge status={batch.status as string} />
            </div>
            <Progress className="mt-4 h-3" value={pct} />
            <p className="mt-2 text-xs text-[#6B7280]">{pct}% matured toward ready gate</p>
            {batch.status === "ready" ? (
              <Button
                className="mt-4"
                type="button"
                onClick={async () => {
                  const { error } = await client.from("decomposition_batches").update({ status: "utilized" }).eq("id", batch.id);
                  if (error) toast.error(error.message);
                  else setRows((current) =>
                    current.map((row) =>
                      row.id === batch.id
                        ? {
                            ...row,
                            status: "utilized",
                          }
                        : row,
                    ),
                  );
                }}
              >
                Mark as utilized
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
