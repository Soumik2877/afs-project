import { redirect } from "next/navigation";

import type { ReactNode } from "react";

import { DriverShell } from "@/components/driver/DriverShell";
import { createClient } from "@/lib/supabase/server";

interface DriverLayoutProps {
  children: ReactNode;
}

export default async function DriverLayout({ children }: DriverLayoutProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirectTo=/driver");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "driver") redirect("/");

  return <DriverShell>{children}</DriverShell>;
}
