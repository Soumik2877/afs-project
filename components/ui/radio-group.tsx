"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import * as React from "react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(function RadioGroup({ className, ...props }, ref) {
  return <RadioGroupPrimitive.Root ref={ref} className={cn("grid gap-3 sm:grid-cols-2", className)} {...props} />;
});

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    title: string;
    description?: string;
  }
>(function RadioGroupItem({ title, description, className, ...props }, ref) {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "rounded-xl border border-[#1F2937] bg-[#0A0F1E] p-4 text-left text-sm text-[#E5E7EB] outline-none transition-colors data-[state=checked]:border-emerald-500 data-[state=checked]:shadow-[0_0_30px_-12px_theme(colors.emerald.500)]",
        className,
      )}
      {...props}
    >
      <span className="flex items-start gap-3">
        <span className="mt-1 grid h-3.5 w-3.5 place-items-center rounded-full border border-[#4b5563] text-[11px] data-[state=checked]:hidden" />
        <RadioGroupPrimitive.Indicator className="mt-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-400 bg-emerald-500 shadow-[0_0_25px_-6px_theme(colors.emerald.400)]" />
        <span>
          <span className="block font-semibold text-[#F9FAFB]">{title}</span>
          {description ? <span className="block text-xs text-[#9CA3AF]">{description}</span> : null}
        </span>
      </span>
    </RadioGroupPrimitive.Item>
  );
});

export { RadioGroup, RadioGroupItem };
