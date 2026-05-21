"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ label = "Sign out", variant }: { label?: string; variant?: Parameters<typeof Button>[0]["variant"] }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/auth/login");

    router.refresh();
  }

  return (
    <Button variant={variant ?? "outline"} type="button" onClick={() => void logout()} className="text-xs uppercase tracking-[0.3em]">
      {label}
    </Button>
  );
}
