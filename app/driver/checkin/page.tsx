import { FacilityCheckinForm } from "@/components/driver/FacilityCheckinForm";
import { createClient } from "@/lib/supabase/server";

export default async function DriverCheckinPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: routes } = await supabase
    .from("routes")
    .select("*")
    .eq("assigned_driver_id", user?.id ?? "")
    .in("status", ["active", "pending"]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Facility check-in</h1>
      <p className="text-[#94A3B8]">Weights auto-wire into decomposition batches when organic payloads arrive.</p>
      <FacilityCheckinForm routes={routes ?? []} driverId={user?.id ?? ""} />
    </div>
  );
}
