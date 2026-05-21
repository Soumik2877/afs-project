"use client";

import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-[#334155] bg-[#0A0F1E] text-emerald-300",
        success: "border-emerald-500/40 bg-emerald-950/70 text-emerald-300",
        warning: "border-amber-500/40 bg-amber-950/60 text-amber-200",
        danger: "border-red-500/40 bg-red-950/60 text-red-200",
        neutral: "border-[#1F2937] bg-[#111827] text-[#CBD5F5]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
