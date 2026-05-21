"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppModal } from "@/components/AppModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { binUpsertSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/client";

import type { BinRow } from "@/types";

interface AdminBinsExplorerProps {
  bins: BinRow[];
}

export function AdminBinsExplorer({ bins }: AdminBinsExplorerProps) {
  const [query, setQuery] = useState("");
  const client = useMemo(() => createClient(), []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return bins;
    return bins.filter((binRow) =>
      [binRow.label, binRow.locality ?? "", binRow.status].join(" ").toLowerCase().includes(needle),
    );
  }, [bins, query]);

  return (
    <div className="space-y-6 rounded-2xl border border-[#1F2937] bg-[#111827] p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-[#6B7280]">Mesh search</p>
        <Input placeholder="Filter bins" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className="max-h-[620px] space-y-3 overflow-auto pr-2">
        {filtered.map((binRow) => (
          <div key={binRow.id} className="rounded-xl border border-[#1F2937] bg-[#0A0F1E] p-4 text-sm">
            <p className="font-semibold text-white">{binRow.label}</p>
            <p className="text-[#9CA3AF]">{binRow.locality ?? "—"}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">
              {binRow.status} · {binRow.fill_level}% · {binRow.bin_type}
            </p>
          </div>
        ))}
      </div>

      <AppModal
        title="Add bin"
        trigger={
          <Button type="button" className="w-full">
            Add bin
          </Button>
        }
      >
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const parsed = binUpsertSchema.safeParse({
              label: form.get("label"),
              locality: form.get("locality")?.toString() || undefined,
              latitude: Number(form.get("latitude")),
              longitude: Number(form.get("longitude")),
              bin_type: form.get("bin_type"),
            });
            if (!parsed.success) {
              toast.error("Check coordinate + label inputs");
              return;
            }

            const { error } = await client.from("bins").insert(parsed.data);

            if (error) toast.error(error.message);
            else {
              toast.success("Saved");
              event.currentTarget.reset();
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input id="label" name="label" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locality">Locality</Label>
            <Input id="locality" name="locality" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" name="latitude" type="number" step="any" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" name="longitude" type="number" step="any" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              name="bin_type"
              className="w-full rounded-lg border border-[#1F2937] bg-[#0A0F1E] px-3 py-2 text-sm"
              defaultValue="general"
            >
              <option value="general">General</option>
              <option value="organic">Organic</option>
              <option value="recyclable">Recyclable</option>
            </select>
          </div>
          <Button type="submit" className="w-full">
            Save bin
          </Button>
        </form>
      </AppModal>
    </div>
  );
}
