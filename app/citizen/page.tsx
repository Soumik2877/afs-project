import { CitizenDashboard } from "@/components/citizen/CitizenDashboard";
import { createClient } from "@/lib/supabase/server";
import { getActiveRouteForTracking } from "@/lib/routes/active-route";

export default async function CitizenHomePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("users").select("locality").eq("id", user?.id ?? "").maybeSingle();

  const tracking = await getActiveRouteForTracking(supabase, {
    locality: profile?.locality ?? "Koramangala",
  });

  return (
    <CitizenDashboard
      tracking={tracking}
      localityLabel={profile?.locality ?? "Koramangala"}
    />
  );
}
