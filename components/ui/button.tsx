"use client";

import * as Slot from "@radix-ui/react-slot";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1E] disabled:pointer-events-none disabled:opacity-50 min-h-[40px]",
  {
    variants: {
      variant: {
        default: "bg-emerald-500 text-[#022c22] hover:bg-emerald-400",
        secondary: "bg-[#3B82F6] text-[#f8fafc] hover:bg-blue-500",
        outline: "border border-[#1F2937] bg-transparent text-[#F9FAFB] hover:bg-[#111827]",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        ghost: "border border-transparent bg-transparent hover:bg-[#111827]",
        link: "text-emerald-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[44px] px-4 py-2",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-[48px] px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot.Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
