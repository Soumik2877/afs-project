"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validations/schemas";

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = handleSubmit(async (payload) => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          phone: payload.phone,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Citizen workspace ready");

    router.replace("/citizen");
    router.refresh();
    setLoading(false);
  });

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#030712] via-[#0A0F1E] to-[#040912] px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        <Card className="border-[#1F2937] bg-[#111827] px-8 py-8 shadow-2xl">
          <CardHeader className="space-y-3">
            <CardTitle className="font-display text-3xl">Join Sustainable Pickups</CardTitle>
            <p className="text-sm leading-relaxed text-[#94A3B8]">
              Residents unlock live truck ETA, compost credit tracking, QR bag passports, and direct ops escalation paths.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...register("fullName")} />
                {errors.fullName ? <p className="text-xs text-red-400">{errors.fullName.message}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" autoComplete="email" type="email" {...register("email")} />
                  {errors.email ? <p className="text-xs text-red-400">{errors.email.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                {errors.password ? <p className="text-xs text-red-400">{errors.password.message}</p> : null}
              </div>
              <Button className="w-full py-6 text-lg" disabled={loading} type="submit">
                {loading ? "Provisioning workspace..." : "Create citizen account"}
              </Button>
              <p className="text-xs text-[#64748b]">
                Driver and admin onboarding is invitation-only via Supabase Dashboard—update roles there when issuing hardware.
              </p>
              <p className="text-center text-sm text-[#6B7280]">
                Returning?{" "}
                <Link className="text-emerald-400 underline-offset-4 hover:underline" href="/auth/login">
                  Continue to ops login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
