"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(function Progress({ className, value, ...props }, ref) {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={cn("relative h-2 overflow-hidden rounded-full bg-[#0A0F1E]", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-500"
        style={{ width: `${value ?? 0}%` }}
      />
    </ProgressPrimitive.Root>
  );
});

export { Progress };
