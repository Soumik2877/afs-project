import Link from "next/link";

import { SimulationStatus } from "@/components/admin/SimulationStatus";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { CollectionProgress } from "@/components/dashboard/CollectionProgress";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AdminBinGrid } from "@/components/dashboard/AdminBinGrid";
import { Button } from "@/components/ui/button";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const todayIso = new Date().toISOString().slice(0, 10);

  const [
    binsResult,
    routesResult,
    complaintsResult,
    complaintsFeed,
    batchResult,
    binAlertsResult,
    anomalyResult,
  ] = await Promise.all([
    supabase.from("bins").select("*").order("label"),
    supabase.from("routes").select("*, driver:assigned_driver_id ( id, full_name )"),
    supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("decomposition_batches").select("*", { count: "exact", head: true }).eq("status", "ready"),
    supabase.from("bin_alerts").select("*, bin:bin_id ( locality )").order("triggered_at", { ascending: false }).limit(5),
    supabase.from("anomaly_alerts").select("*").eq("acknowledged", false).order("created_at", { ascending: false }).limit(3),
  ]);

  const binsData = binsResult.data ?? [];

  const routesToday = (routesResult.data ?? []).filter(
    (route) => route.shift_date === todayIso && route.status !== "completed",
  );

  const openComplaints = complaintsResult.count ?? 0;

  const readyBatches = batchResult.count ?? 0;

  const anomalies = anomalyResult.data ?? [];

  const anomalyFeed = anomalies.map((entry) => ({
    kind: "anomaly" as const,
    id: entry.id,
    severity: entry.severity,
    reason: entry.reason,
    acknowledged: entry.acknowledged,
    route_id: entry.route_id,
    driver_id: entry.driver_id,
    details: entry.details ?? null,
    created_at: entry.created_at,
  }));

  const binFeed =
    binAlertsResult.data?.map((row) => {
      const binJoin = row.bin as { locality: string | null } | null | undefined;
      return {
        kind: "bin" as const,
        id: row.id,
        bin_id: row.bin_id,
        triggered_at: row.triggered_at,
        acknowledged: row.acknowledged,
        locality: binJoin?.locality ?? null,
      };
    }) ?? [];

  const complaintFeed =
    complaintsFeed.data?.map((row) => ({
      kind: "complaint" as const,
      ...(row as any),
    })) ?? [];

  const combinedFeed = [...complaintFeed, ...binFeed, ...anomalyFeed].slice(0, 14);

  const iotEnabled = process.env.IOT_SIMULATION_ENABLED === "true";
  const driverEnabled = process.env.DRIVER_SIMULATION_ENABLED === "true";
  const anomalyDemo = process.env.DRIVER_SIMULATION_ANOMALY === "true";

  return (
    <div className="space-y-12">
      <SimulationStatus
        iotEnabled={iotEnabled}
        driverEnabled={driverEnabled}
        anomalyDemo={anomalyDemo}
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard description="Across all districts" label="Bins connected" value={binsData.length} />
        <StatsCard description="Today's manifest" label="Active trucks" value={routesToday.length} />
        <StatsCard description="Citizen escalation" label="Open complaints" value={openComplaints} />
        <StatsCard description="Organic compost runway" label="Batches staged" value={readyBatches} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#141c2f] bg-gradient-to-br from-[#0b1228] via-[#0A0F1E] to-[#050913] px-6 py-5">
            <div>
              <p className="font-display text-4xl tracking-tight">Citywide telemetry</p>
              <p className="max-w-xl text-[#94A3B8]">
                Telemetry from IoT pings, citizen complaints and fleet GPS streams into this console.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="text-xs uppercase tracking-[0.35em]" asChild>
                <Link href="/admin/routes">Create route</Link>
              </Button>
              <Button variant="outline" className="text-xs uppercase tracking-[0.35em]" asChild>
                <Link href="/admin/fleet">Fleet radar</Link>
              </Button>
              <Button variant="outline" className="text-xs uppercase tracking-[0.35em]" asChild>
                <Link href="/admin/bins">Add bin</Link>
              </Button>
            </div>
          </div>
          <AdminBinGrid seed={binsData} />
          <RoutesBoard routesToday={routesToday} bins={binsData} />
        </div>

        <div className="space-y-6">
          <CollectionProgress bins={binsData} />
          <AlertFeed items={combinedFeed} />
        </div>
      </div>
    </div>
  );
}

function RoutesBoard({ routesToday, bins }: { routesToday: any[]; bins: any[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl">Active routes ({routesToday.length})</h2>
        <Button variant="outline" size="sm" className="text-xs uppercase tracking-[0.35em]" asChild>
          <Link href="/admin/routes">Route studio</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Manifest</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
          </tr>
        </TableHeader>
        <tbody>
          {routesToday.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[#64748b]">
                No manifests today
              </TableCell>
            </TableRow>
          ) : (
            routesToday.map((route: any) => {
              const total = route.bin_ids?.length ?? 0;

              const collected =
                bins.filter((binRow) => route.bin_ids?.includes(binRow.id) && binRow.status === "collected").length ??
                0;

              return (
                <TableRow key={route.id}>
                  <TableCell>
                    <div className="font-semibold text-white">{route.name}</div>
                    <p className="text-xs uppercase tracking-[0.4em] text-[#475569]">{route.shift_date}</p>
                  </TableCell>
                  <TableCell>{route.driver?.full_name ?? route.assigned_driver_id}</TableCell>
                  <TableCell>{route.vehicle_number}</TableCell>
                  <TableCell>
                    <div className="font-mono text-sm text-emerald-300">{collected}</div>
                    <span className="text-xs text-[#6B7280]"> / {total}</span>
                  </TableCell>
                  <TableCell className="capitalize">{route.status}</TableCell>
                </TableRow>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}
