"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        toastOptions={{
          className: "border border-[#1F2937] bg-[#111827] text-[#F9FAFB]",
        }}
        richColors={false}
        theme="dark"
      />
    </>
  );
}
