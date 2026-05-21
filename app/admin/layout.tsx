import { redirect } from "next/navigation";

import type { ReactNode } from "react";

import { AdminWorkbench } from "@/components/admin/AdminWorkbench";
import { createClient } from "@/lib/supabase/server";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=/admin`);
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return <AdminWorkbench>{children}</AdminWorkbench>;
}
