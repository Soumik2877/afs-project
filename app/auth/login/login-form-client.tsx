"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations/schemas";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginFormClient() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function authenticate(values: LoginValues) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = user
      ? await supabase.from("users").select("role").eq("id", user.id).maybeSingle()
      : { data: null };

    const role = profile?.role as "admin" | "driver" | "citizen" | undefined;
    const roleHome =
      role === "admin" ? "/admin" : role === "driver" ? "/driver" : "/citizen";

    const redirectTo = searchParams.get("redirectTo");

    if (redirectTo?.startsWith("/admin") && role !== "admin") {
      toast.error(
        profile
          ? "This account is not an admin. In Supabase, set public.users.role to admin for your user."
          : "No profile row found. Run the SQL in README to create or fix your public.users record.",
      );
      router.replace(roleHome);
      router.refresh();
      setLoading(false);
      return;
    }

    toast.success("Authenticated");
    router.replace(redirectTo && redirectTo !== "/" ? redirectTo : roleHome);
    router.refresh();
    setLoading(false);
  }

  const onSubmit = handleSubmit(async (vals) => authenticate(vals));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#070b16] to-[#0A0F1E] px-4 py-16">
      <Card className="w-full max-w-md border-[#1F2937] bg-[#111827] shadow-[0_25px_120px_-50px_rgba(16,185,129,0.45)]">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Mission Control Login</CardTitle>
          <p className="text-sm text-[#9CA3AF]">Use the credential issued by your waste operations administrator.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email ? <p className="text-xs text-red-400">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
              {errors.password ? <p className="text-xs text-red-400">{errors.password.message}</p> : null}
            </div>
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Continue"}
            </Button>
            <p className="text-center text-sm text-[#6B7280]">
              New resident?{" "}
              <Link href="/auth/signup" className="text-emerald-400 underline">
                Create citizen workspace
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
