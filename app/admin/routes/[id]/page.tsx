import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { MapErrorBoundary } from "@/components/maps/MapErrorBoundary";
import { createClient } from "@/lib/supabase/server";

const LiveRouteTracker = dynamic(
  () => import("@/components/maps/LiveRouteTracker").then((mod) => mod.LiveRouteTracker),
  { ssr: false },
);

interface RouteDetailProps {
  params: { id: string };
}

export default async function AdminRouteDetailPage({ params }: RouteDetailProps) {
  const supabase = createClient();

  const { data: route } = await supabase.from("routes").select("*").eq("id", params.id).maybeSingle();

  if (!route) notFound();

  const binIds = (route.bin_ids as string[])?.filter(Boolean) ?? [];

  const [{ data: bins }, { data: driverLocation }, { data: driver }, { data: pickups }] = await Promise.all([
    binIds.length ? supabase.from("bins").select("*").in("id", binIds) : { data: [] },
    route.assigned_driver_id
      ? supabase
          .from("driver_locations")
          .select("*")
          .eq("driver_id", route.assigned_driver_id)
          .maybeSingle()
      : { data: null },
    route.assigned_driver_id
      ? supabase.from("users").select("full_name").eq("id", route.assigned_driver_id).maybeSingle()
      : { data: null },
    supabase.from("pickups").select("bin_id").eq("route_id", route.id),
  ]);

  const orderedBins = [...(bins ?? [])].sort((a, b) => binIds.indexOf(a.id) - binIds.indexOf(b.id));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">{route.name}</h1>
        <p className="text-[#9CA3AF]">
          Shift {route.shift_date} · {route.status} · Vehicle {route.vehicle_number ?? "—"}
        </p>
        <p className="mt-2 text-sm text-[#64748B]">
          Live truck tracking — bins empty as the driver completes each stop (run{" "}
          <code className="text-emerald-400">npm run simulate:driver</code> for demo movement).
        </p>
      </div>

      {route.assigned_driver_id && orderedBins.length ? (
        <MapErrorBoundary>
          <LiveRouteTracker
            bins={orderedBins}
            binOrder={binIds}
            driverId={route.assigned_driver_id}
            routeId={route.id}
            driverName={driver?.full_name}
            driverLocation={driverLocation}
            collectedBinIds={(pickups ?? []).map((row) => row.bin_id as string)}
          />
        </MapErrorBoundary>
      ) : (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          Assign a driver and add bins to this route to enable live tracking.
        </p>
      )}
    </div>
  );
}
