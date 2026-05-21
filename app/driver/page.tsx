import Link from "next/link";

import { RouteCard } from "@/components/driver/RouteCard";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function DriverHomePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayIso = new Date().toISOString().slice(0, 10);

  const { data: todaysRoutes } = await supabase
    .from("routes")
    .select("*")
    .eq("assigned_driver_id", user?.id ?? "")
    .eq("shift_date", todayIso);

  const { data: completed } = await supabase
    .from("routes")
    .select("*")
    .eq("assigned_driver_id", user?.id ?? "")
    .eq("status", "completed")
    .order("shift_date", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl">Today&apos;s operations</h1>
        <p className="text-[#94A3B8]">Manifests syncing from Neo-Waste Control.</p>
      </div>

      {(todaysRoutes ?? []).map((route) => (
        <RouteCard key={route.id} route={route}>
          <Button asChild size="lg" className="w-full">
            <Link href={`/driver/route/${route.id}`}>{route.status === "active" ? "Resume route" : "Start route"}</Link>
          </Button>
        </RouteCard>
      ))}

      <div className="space-y-3">
        <h2 className="font-semibold uppercase tracking-[0.45em] text-[#475569]">Recent completions</h2>
        <div className="space-y-2 text-sm">
          {(completed ?? []).map((route) => (
            <Link key={route.id} href={`/driver/route/${route.id}`} className="block rounded-lg border border-[#1F2937] bg-[#111827] p-4">
              {route.name} · {route.shift_date}
            </Link>
          ))}
          {!completed?.length ? <p className="text-[#64748b]">Completed missions will populate here.</p> : null}
        </div>
      </div>
    </div>
  );
}
