import { notFound } from "next/navigation";

import { BinChecklist } from "@/components/driver/BinChecklist";
import { createClient } from "@/lib/supabase/server";

interface DriverRouteDetailProps {
  params: { id: string };
}

export default async function DriverRoutePage({ params }: DriverRouteDetailProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: route } = await supabase.from("routes").select("*").eq("id", params.id).maybeSingle();

  if (!route || route.assigned_driver_id !== user?.id) {
    notFound();
  }

  const { data: bins } = await supabase.from("bins").select("*").in("id", route.bin_ids ?? []);

  const { data: pickups } = await supabase.from("pickups").select("*").eq("route_id", route.id).eq("driver_id", user?.id ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">{route.name}</h1>
        <p className="text-sm text-[#94A3B8]">{route.shift_date}</p>
      </div>
      <BinChecklist
        route={route}
        bins={bins ?? []}
        pickups={pickups ?? []}
        driverId={user?.id ?? ""}
      />
    </div>
  );
}
