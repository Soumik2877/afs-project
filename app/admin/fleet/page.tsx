import dynamic from "next/dynamic";
import Link from "next/link";

import { FleetLive, type FleetSeed } from "@/components/maps/FleetLive";
import { MapErrorBoundary } from "@/components/maps/MapErrorBoundary";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getActiveRouteForTracking } from "@/lib/routes/active-route";

const LiveRouteTracker = dynamic(
  () => import("@/components/maps/LiveRouteTracker").then((mod) => mod.LiveRouteTracker),
  { ssr: false },
);

export default async function AdminFleetPage() {
  const supabase = createClient();

  const [{ data: locations }, { data: users }, tracking] = await Promise.all([
    supabase.from("driver_locations").select("*"),
    supabase.from("users").select("id, full_name"),
    getActiveRouteForTracking(supabase),
  ]);

  const nameById = Object.fromEntries((users ?? []).map((row) => [row.id, row.full_name]));

  const seed: FleetSeed[] = (locations ?? []).map((row) => ({
    ...row,
    meta: {
      full_name: nameById[row.driver_id],
    },
  }));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl">Live fleet telemetry</h1>
        {tracking ? (
          <Button variant="outline" asChild>
            <Link href={`/admin/routes/${tracking.route.id}`}>Route detail</Link>
          </Button>
        ) : null}
      </div>

      {tracking ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl">Active route · {tracking.route.name}</h2>
          <p className="text-sm text-[#94A3B8]">
            Zomato-style live truck — bins turn empty as the vehicle reaches each stop.
          </p>
          <MapErrorBoundary>
            <LiveRouteTracker
              bins={tracking.bins}
              binOrder={tracking.route.bin_ids}
              driverId={tracking.route.assigned_driver_id!}
              routeId={tracking.route.id}
              driverName={tracking.driverName}
              driverLocation={tracking.driverLocation}
              collectedBinIds={tracking.collectedBinIds}
            />
          </MapErrorBoundary>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl">All drivers</h2>
        <FleetLive seed={seed} />
      </section>

      <aside className="rounded-xl border border-[#1F2937] bg-[#111827] p-4">
        <p className="text-xs uppercase tracking-[0.4em] text-[#64748b]">Last ping</p>
        <div className="mt-4 space-y-2 text-sm text-[#E2E8F0]">
          {seed.slice(0, 12).map((entry) => (
            <div key={entry.driver_id} className="flex items-center justify-between">
              <span>{entry.meta?.full_name ?? entry.driver_id}</span>
              <span className="font-mono text-xs text-[#94A3B8]">
                {new Date(entry.updated_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
