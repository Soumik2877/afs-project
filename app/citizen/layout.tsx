import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { CitizenShell } from "@/components/citizen/CitizenShell";
import { createClient } from "@/lib/supabase/server";

interface CitizenLayoutProps {
  children: ReactNode;
}

export default async function CitizenLayout({ children }: CitizenLayoutProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/citizen");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("eco_points, locality, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "citizen") {
    redirect("/");
  }

  return <CitizenShell ecoPoints={profile?.eco_points ?? 0}>{children}</CitizenShell>;
}
