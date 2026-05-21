import { ComplaintForm } from "@/components/citizen/ComplaintForm";

import { createClient } from "@/lib/supabase/server";

export default async function CitizenReportPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-4xl">Report an issue</h1>
        <p className="text-[#94A3B8]">Evidence-backed complaints route straight to HQ.</p>
      </div>
      <ComplaintForm citizenId={user?.id ?? ""} />
    </div>
  );
}
