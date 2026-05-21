"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

import type { FacilityWasteType, RouteRow } from "@/types";

interface FacilityCheckinFormProps {
  routes: RouteRow[];
  driverId: string;
}

type FormShape = {
  route_id: string;
  facility_name: string;
  waste_type: FacilityWasteType;
  weight_kg: number;
};

export function FacilityCheckinForm({ routes, driverId }: FacilityCheckinFormProps) {
  const client = useMemo(() => createClient(), []);

  const { register, handleSubmit } = useForm<FormShape>({
    defaultValues: {
      route_id: routes[0]?.id ?? "",
      waste_type: "general",
      weight_kg: 0,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const position = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (reading) => resolve(reading),
        () => resolve(null),
        { enableHighAccuracy: true },
      );
    });

    const payload = {
      route_id: values.route_id,
      driver_id: driverId,
      facility_name: values.facility_name,
      waste_type: values.waste_type,
      weight_kg: Number(values.weight_kg),
      latitude: position?.coords.latitude ?? null,
      longitude: position?.coords.longitude ?? null,
    };

    const { error } = await client.from("facility_checkins").insert(payload);

    if (error) {
      toast.error(error.message);
      return;
    }

    await client.from("routes").update({ status: "completed" }).eq("id", values.route_id);

    toast.success("Facility check-in synced");
  });

  return (
    <form className="space-y-6 rounded-3xl border border-[#142033] bg-[#0f172d] px-6 py-8 shadow-inner" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="route">Mission</Label>
        <select id="route" className="w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 py-3 text-sm" {...register("route_id")}>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="facility_name">Facility</Label>
        <Input id="facility_name" {...register("facility_name", { required: true })} placeholder="EcoSort North" />
      </div>
      <div className="space-y-2">
        <Label>Type</Label>
        <select className="w-full rounded-xl border border-[#1F2937] bg-[#0B1120] px-3 py-3 text-sm" {...register("waste_type")}>
          <option value="general">General</option>
          <option value="organic">Organic</option>
          <option value="recyclable">Recyclable</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="weight">Weight kg</Label>
        <Input id="weight" type="number" step="any" {...register("weight_kg", { valueAsNumber: true })} />
      </div>
      <Button className="w-full py-6 text-lg" type="submit">
        Submit telemetry
      </Button>
    </form>
  );
}
