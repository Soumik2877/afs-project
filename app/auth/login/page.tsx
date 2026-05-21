import { Suspense } from "react";

import { LoginFormClient } from "./login-form-client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0A0F1E] text-sm text-[#94A3B8]">
          Connecting to Supabase Secure Channel…
        </div>
      }
    >
      <LoginFormClient />
    </Suspense>
  );
}
