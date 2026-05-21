import { CitizenQrClient } from "@/components/citizen/CitizenQrClient";
import { createClient } from "@/lib/supabase/server";

export default async function CitizenQrPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-4xl">Your QR passes</h1>
        <p className="text-[#94A3B8]">
          Issue a recyclable or organic bag QR tile; drivers scan it during pickup to award eco-points.
        </p>
      </div>
      <CitizenQrClient citizenId={user?.id ?? ""} />
    </div>
  );
}
