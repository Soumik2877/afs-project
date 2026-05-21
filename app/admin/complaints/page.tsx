import { ComplaintsKanban } from "@/components/dashboard/ComplaintsKanban";
import { createClient } from "@/lib/supabase/server";

export default async function AdminComplaintsPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("complaints")
    .select(
      `
        *,
        reporter:reported_by ( full_name )
      `,
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">Complaint radar</h1>
        <p className="text-[#94A3B8]">Lifecycle management with photo evidence anchors.</p>
      </div>
      <ComplaintsKanban complaints={data ?? []} />
    </div>
  );
}
