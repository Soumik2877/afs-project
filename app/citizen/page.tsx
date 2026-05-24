import { CitizenDashboard } from "@/components/citizen/CitizenDashboard";
import { getDemoRouteLocality } from "@/lib/simulation/demo-loop";
import { getActiveRouteForTracking } from "@/lib/routes/active-route";
import { createClient } from "@/lib/supabase/server";

export default async function CitizenHomePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tracking = await getActiveRouteForTracking(supabase);

  return (
    <CitizenDashboard
      tracking={tracking}
      localityLabel={tracking?.route.name ?? getDemoRouteLocality()}
      citizenId={user?.id ?? null}
    />
  );
}
