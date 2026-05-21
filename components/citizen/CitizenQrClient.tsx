"use client";

import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

type BagType = "recyclable" | "organic";

type QrRow = {
  code_string: string;
  bag_type: BagType;
  scanned_at: string | null;
  created_at: string;
  eco_points_awarded: number;
};

export function CitizenQrClient({ citizenId }: { citizenId: string }) {
  const [codes, setCodes] = useState<QrRow[]>([]);
  const [bagChoice, setBagChoice] = useState<BagType>("recyclable");

  const load = useCallback(async () => {
    const client = createClient();
    const { data, error } = await client
      .from("qr_codes")
      .select("code_string, bag_type, scanned_at, created_at, eco_points_awarded")
      .eq("citizen_id", citizenId)
      .order("created_at", { ascending: false });

    if (error) toast.error(error.message);
    else setCodes((data as QrRow[]) ?? []);
  }, [citizenId]);

  useEffect(() => {
    void load();
  }, [load]);

  const issueCode = async () => {
    const code_string = crypto.randomUUID();

    const client = createClient();
    const { error } = await client.from("qr_codes").insert({
      citizen_id: citizenId,
      code_string,
      bag_type: bagChoice,
    });

    if (error) toast.error(error.message);
    else toast.success(`${bagChoice} bag QR ready`);
    await load();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[#1F2937] bg-[#111827] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-[#64748B]">Separation rewarded</p>
          <p className="font-display text-3xl">Pickup QR tiles</p>
          <p className="max-w-xl text-[#CBD5F5]">Drivers scan your code at curbside; eco-points credit after verification.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Button type="button" variant={bagChoice === "recyclable" ? "default" : "outline"} onClick={() => setBagChoice("recyclable")}>
              Recyclable
            </Button>
            <Button type="button" variant={bagChoice === "organic" ? "default" : "outline"} onClick={() => setBagChoice("organic")}>
              Organic
            </Button>
          </div>
          <Button className="px-8 py-6 text-lg" type="button" onClick={issueCode}>
            Generate QR
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {codes.length === 0 ? (
          <p className="text-[#94A3B8]">No QR tiles yet. Pick a bag type and generate one to show at collection.</p>
        ) : (
          codes.map((row) => (
            <div key={row.code_string} className="space-y-4 rounded-[24px] border border-[#1F2937] bg-[#0F172A] p-5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="neutral">{row.bag_type}</Badge>
                {row.scanned_at ? (
                  <span className="text-xs text-emerald-300">Scanned</span>
                ) : (
                  <span className="text-xs text-amber-200">Active</span>
                )}
              </div>
              <div className="flex justify-center rounded-2xl bg-white p-4">
                <QRCodeSVG value={row.code_string} size={180} />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" type="button">
                    Show enlarged
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md border-[#1F2937] bg-[#0B1120]">
                  <DialogHeader>
                    <DialogTitle>Pickup code</DialogTitle>
                    <DialogDescription>Let the driver scan this full-size tile.</DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center rounded-2xl bg-white p-6">
                    <QRCodeSVG value={row.code_string} size={280} />
                  </div>
                </DialogContent>
              </Dialog>
              <p className="break-all font-mono text-xs text-[#94A3B8]">{row.code_string}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
