"use client";

import { Card } from "@/components/ui/card";
import type { AnomalyAlertRow, BinAlertRow, ComplaintRow } from "@/types";

type FeedUnion =
  | ({ kind: "complaint" } & ComplaintRow)
  | ({ kind: "bin" } & BinAlertRow & { locality?: string | null })
  | ({ kind: "anomaly" } & AnomalyAlertRow);

interface AlertFeedProps {
  items?: FeedUnion[];
}

export function AlertFeed({ items = [] }: AlertFeedProps) {
  return (
    <Card className="divide-y divide-[#1F2937] border-[#1F2937] bg-[#0F172A]">
      <div className="flex items-center justify-between border-b border-[#1F2937]/60 px-6 py-4">
        <h3 className="font-display text-lg">Operational Feed</h3>
        <span className="text-xs uppercase tracking-[0.4em] text-[#64748b]">{items.length} events</span>
      </div>
      <div className="flex max-h-[420px] flex-col gap-0 overflow-auto">
        {items.length === 0 ? (
          <div className="px-6 py-10 text-sm text-[#6B7280]">No active alerts detected.</div>
        ) : (
          items.map((feedItem) =>
            feedItem.kind === "complaint" ? (
              <div key={`c-${feedItem.id}`} className="animate-slideIn px-6 py-4 text-sm hover:bg-black/35">
                <p className="font-semibold capitalize text-[#FECACA]">{feedItem.complaint_type}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">
                  Citizen · {feedItem.created_at.slice(0, 16)}
                </p>
                <p className="text-[#CBD5F5]">{feedItem.description}</p>
              </div>
            ) : feedItem.kind === "bin" ? (
              <div key={`b-${feedItem.id}`} className="animate-slideIn px-6 py-4 text-sm hover:bg-black/35">
                <p className="font-semibold text-amber-200">
                  BIN ALERT ({feedItem.locality ?? "unspecified locality"})
                </p>
                <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{feedItem.triggered_at.slice(0, 16)}</p>
              </div>
            ) : (
              <div key={`a-${feedItem.id}`} className="animate-slideIn px-6 py-4 text-sm hover:bg-black/35">
                <p className="font-semibold text-red-400">Fleet anomaly · {feedItem.severity}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">{feedItem.created_at.slice(0, 16)}</p>
                <p className="text-[#FECACA]">{feedItem.reason}</p>
              </div>
            ),
          )
        )}
      </div>
    </Card>
  );
}
