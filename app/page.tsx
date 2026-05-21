import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "driver") redirect("/driver");
  redirect("/citizen");
}
