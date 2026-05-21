"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-8 text-center">
      <p className="font-display text-2xl text-white">Admin console error</p>
      <p className="mt-2 text-sm text-[#94A3B8]">{error.message}</p>
      <Button className="mt-6" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
