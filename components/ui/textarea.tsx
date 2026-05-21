import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[120px] w-full rounded-lg border border-[#1F2937] bg-[#0A0F1E] px-3 py-2 text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/60",
        className,
      )}
      {...props}
    />
  );
});

export { Textarea };
