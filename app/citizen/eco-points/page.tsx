import { createClient } from "@/lib/supabase/server";

import { Badge } from "@/components/ui/badge";

export default async function CitizenEcoPointsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("users").select("eco_points").eq("id", user?.id ?? "").maybeSingle();

  const { data: history } = await supabase
    .from("qr_codes")
    .select("code_string, eco_points_awarded, scanned_at, created_at")
    .eq("citizen_id", user?.id ?? "")
    .not("scanned_at", "is", null)
    .order("scanned_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#1F2937] bg-gradient-to-br from-[#10B981]/20 to-[#0B1120] p-8">
        <p className="text-xs uppercase tracking-[0.45em] text-[#CFFAFE]">Balance</p>
        <p className="font-display text-5xl text-white">{profile?.eco_points ?? 0}</p>
        <p className="text-[#CFFAFE]">Eco-points from verified driver scans.</p>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-2xl">QR scan history</h2>
        {(history ?? []).length === 0 ? (
          <p className="text-[#94A3B8]">Nothing redeemed yet — generate a QR tile and meet your crew on route day.</p>
        ) : (
          <div className="space-y-2">
            {(history ?? []).map((row) => (
              <div
                key={`${row.code_string}-${row.scanned_at}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1F2937] bg-[#111827] px-4 py-3"
              >
                <div>
                  <p className="break-all font-mono text-xs text-[#94A3B8]">{row.code_string}</p>
                  <p className="text-sm text-[#CBD5F5]">Scanned {new Date(row.scanned_at ?? "").toLocaleString()}</p>
                </div>
                <Badge variant="success">+{row.eco_points_awarded ?? 0}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
