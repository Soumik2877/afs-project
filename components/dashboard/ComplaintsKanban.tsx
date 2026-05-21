"use client";

import { useMemo, useState } from "react";

import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

import type { ComplaintStatus, ComplaintWithUser } from "@/types";

const columns: ComplaintStatus[] = ["open", "in_progress", "resolved"];

interface ComplaintsKanbanProps {
  complaints: ComplaintWithUser[];
}

export function ComplaintsKanban({ complaints }: ComplaintsKanbanProps) {
  const client = useMemo(() => createClient(), []);
  const [items, setItems] = useState(complaints);

  const grouped = useMemo(() => {
    const map: Record<ComplaintStatus, ComplaintWithUser[]> = {
      open: [],
      in_progress: [],
      resolved: [],
    };

    items.forEach((item) => {
      map[item.status]?.push(item);
    });

    return map;
  }, [items]);

  async function mutateStatus(id: string, status: ComplaintStatus) {
    const payload = status === "resolved" ? ({ status, resolved_at: new Date().toISOString() } as const) : { status };

    const { error } = await client.from("complaints").update(payload).eq("id", id);

    if (!error) {
      setItems((current) =>
        current.map((row) =>
          row.id === id
            ? {
                ...row,
                status,
                resolved_at:
                  status === "resolved"
                    ? new Date().toISOString()
                    : null,
              }
            : row,
        ),
      );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {columns.map((column) => (
        <div key={column} className="space-y-3 rounded-2xl border border-[#1F2937] bg-[#111827]/80 p-4">
          <h3 className="font-display text-lg capitalize">{column.replace("_", " ")}</h3>
          <div className="space-y-3">
            {grouped[column]?.map((ticket) => (
              <article key={ticket.id} className="rounded-xl border border-[#243045] bg-[#0f172d] p-4 text-sm shadow-sm">
                <p className="font-semibold text-white capitalize">{ticket.complaint_type}</p>
                <p className="text-[#94A3B8]">{ticket.description ?? "No description"}</p>
                <p className="text-xs uppercase tracking-[0.4em] text-[#475569]">
                  {ticket.reporter?.full_name ?? "Citizen"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AppModal
                    title="Manage complaint"
                    trigger={
                      <Button variant="outline" size="sm" type="button">
                        Details
                      </Button>
                    }
                  >
                    <div className="space-y-3">
                      <select
                        defaultValue={ticket.status}
                        className="w-full rounded-lg border border-[#1F2937] bg-[#0A0F1E] px-3 py-2 text-sm"
                        onChange={(event) =>
                          mutateStatus(ticket.id, event.target.value as ComplaintStatus)
                        }
                      >
                        {columns.map((option) => (
                          <option key={option} value={option}>
                            {option.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          navigator.clipboard?.writeText(
                            `https://www.google.com/maps?q=${ticket.latitude ?? 0},${ticket.longitude ?? 0}`,
                          )
                        }
                      >
                        Copy map link
                      </Button>
                      {ticket.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ticket.photo_url} alt="" className="rounded-lg border border-[#243045]" />
                      ) : null}
                    </div>
                  </AppModal>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
