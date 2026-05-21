import { ReportsExportClient } from "@/components/dashboard/ReportsExportClient";

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">Telemetry exports</h1>
        <p className="text-[#94A3B8]">PDF snapshots with jsPDF/autotable · CSV slicing via Papa Parse.</p>
      </div>
      <ReportsExportClient />
    </div>
  );
}
