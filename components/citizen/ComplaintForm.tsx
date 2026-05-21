"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { complaintSchema } from "@/lib/validations/schemas";
import { createClient } from "@/lib/supabase/client";

const PinMap = dynamic(() => import("@/components/citizen/ComplaintPinMap"), { ssr: false });

type FormValues = {
  complaint_type: "overflow" | "illegal_dumping" | "dead_animal" | "other";
  description: string;
  latitude: number;
  longitude: number;
  photo?: FileList;
};

export function ComplaintForm({ citizenId }: { citizenId: string }) {
  const supabase = createClient();
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 12.97, lng: 77.59 });

  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      complaint_type: "overflow",
      description: "",
      latitude: coords.lat,
      longitude: coords.lng,
    },
  });

  const syncCoords = useCallback(
    (lat: number, lng: number) => {
      setCoords({ lat, lng });
      setValue("latitude", lat);
      setValue("longitude", lng);
    },
    [setValue],
  );

  const onSubmit = handleSubmit(async (values) => {
    const parsed = complaintSchema.safeParse({
      complaint_type: values.complaint_type,
      description: values.description,
      latitude: coords.lat,
      longitude: coords.lng,
      photo_url: null,
    });

    if (!parsed.success) {
      toast.error("Check form inputs");
      return;
    }

    let photoUrl: string | null = null;

    const file = values.photo?.[0];

    if (file) {
      const objectPath = `${citizenId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage.from("complaint-photos").upload(objectPath, file, {
        upsert: true,
      });

      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const { data: publicUrl } = supabase.storage.from("complaint-photos").getPublicUrl(objectPath);

      photoUrl = publicUrl.publicUrl;
    }

    const { error } = await supabase.from("complaints").insert({
      reported_by: citizenId,
      complaint_type: parsed.data.complaint_type,
      description: parsed.data.description,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      photo_url: photoUrl,
    });

    if (error) toast.error(error.message);
    else toast.success("Complaint logged for ops review");
  });

  return (
    <form className="space-y-6 rounded-[28px] border border-[#1F2937] bg-[#111827] p-6" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label>Incident type</Label>
        <RadioGroup
          defaultValue="overflow"
          className="grid gap-3"
          onValueChange={(value) => setValue("complaint_type", value as FormValues["complaint_type"])}
        >
          <RadioGroupItem value="overflow" title="Overflow" description="Bin spilling into walkway" />
          <RadioGroupItem value="illegal_dumping" title="Illegal dumping" description="Unauthorised waste pile" />
          <RadioGroupItem value="dead_animal" title="Biohazard" description="Requires hazmat response" />
          <RadioGroupItem value="other" title="Other" description="Escalate to supervisor" />
        </RadioGroup>
        <input type="hidden" {...register("complaint_type")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Details</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div className="space-y-2">
        <Label>Location pin</Label>
        <PinMap latitude={coords.lat} longitude={coords.lng} onChange={syncCoords} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photo">Photo evidence</Label>
        <Input id="photo" type="file" accept="image/*" {...register("photo")} />
      </div>

      <Button className="w-full py-6 text-lg" type="submit">
        Submit to operations
      </Button>
    </form>
  );
}
