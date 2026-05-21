import { NextResponse } from "next/server";
import Papa from "papaparse";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

import { createClient } from "@/lib/supabase/server";
import { exportReportSchema } from "@/lib/validations/schemas";

export async function POST(request: Request) {
  const parsed = exportReportSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

  if (profile.data?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pickups = await supabase
    .from("pickups")
    .select("picked_up_at, driver_id")
    .gte("picked_up_at", parsed.data.from)
    .lte("picked_up_at", parsed.data.to);

  const complaints = await supabase
    .from("complaints")
    .select("status, created_at")
    .gte("created_at", parsed.data.from)
    .lte("created_at", parsed.data.to);

  const facility = await supabase
    .from("facility_checkins")
    .select("weight_kg, checked_in_at")
    .gte("checked_in_at", parsed.data.from)
    .lte("checked_in_at", parsed.data.to);

  if (facility.error || pickups.error || complaints.error) {
    return NextResponse.json({ error: "Unable to assemble metrics" }, { status: 500 });
  }

  const totals = {
    totalWasteKg: facility.data?.reduce((sum, row) => sum + (row.weight_kg ?? 0), 0) ?? 0,
    binsServiced: pickups.data?.length ?? 0,
    complaintsRecorded: complaints.data?.length ?? 0,
  };

  const rows = [
    ["Metric", "Value"],
    ["Collected mass (kg)", totals.totalWasteKg.toFixed(2)],
    ["Bins serviced", `${totals.binsServiced}`],
    ["Complaints filed", `${totals.complaintsRecorded}`],
  ];

  if (parsed.data.format === "csv") {
    const csv = Papa.unparse({
      fields: rows[0]! as string[],
      data: rows.slice(1),
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="neo-waste-report.csv"`,
      },
    });
  }

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Neo-Waste Operational Report", 14, 20);
  doc.setFontSize(11);
  doc.text(`${parsed.data.from} → ${parsed.data.to}`, 14, 30);

  autoTable(doc, {
    head: [rows[0] as string[]],
    body: rows.slice(1),
    startY: 38,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  const arrayBuffer = doc.output("arraybuffer");

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="neo-waste-report.pdf"`,
    },
  });
}
