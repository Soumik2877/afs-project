import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-[#1F2937] bg-[#0A0F1E] px-3 py-2 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/60",
        className,
      )}
      {...props}
    />
  );
});

export { Input };
