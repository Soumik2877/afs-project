"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const palette = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

export function ReportsExportClient() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));

  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const chartData = Array.from({ length: 8 }).map((_, index) => ({
    label: `W${index + 1}`,
    kg: Math.round(Math.random() * 400),
  }));

  const pieData = [
    { name: "Organic", value: 40 },
    { name: "Recyclable", value: 32 },
    { name: "General", value: 28 },
  ];

  async function download(format: "pdf" | "csv") {
    const response = await fetch("/api/export-report", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, format }),
    });

    if (!response.ok) {
      toast.error(await response.text());
      return;
    }

    const blob = await response.blob();
    const link = window.document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = `report.${format}`;
    link.click();

    toast.success(`${format.toUpperCase()} exporting`);
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-[#1F2937] bg-[#111827] p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#64748b]">From</p>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[#64748b]">To</p>
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => download("pdf")}>
            Export PDF
          </Button>
          <Button type="button" onClick={() => download("csv")}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#64748b]">
            Weekly hauling pressure
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="label" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #243045", color: "#F8FAFC" }} />
              <Line type="monotone" dot={false} dataKey="kg" stroke="#10B981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-80 rounded-2xl border border-[#1F2937] bg-[#111827] p-4">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[#64748b]">Stream mix</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
