import { DecompositionBoard } from "@/components/dashboard/DecompositionBoard";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDecompositionPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("decomposition_batches")
    .select(
      `
        *,
        facility_checkins (*)
      `,
    )
    .order("estimated_ready_at", { ascending: true });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl">Decomposition runway</h1>
        <p className="text-[#94A3B8]">90-day anaerobic maturation checkpoints.</p>
      </div>
      <DecompositionBoard batches={data ?? []} />
    </div>
  );
}
