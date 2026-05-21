"use client";

import * as SheetPrimitive from "@radix-ui/react-dialog";
import * as React from "react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;

function SheetOverlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>) {
  return <SheetPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/70", className)} {...props} />;
}

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: "left" | "right";
}

function SheetContent({ className, children, side = "right", ...props }: SheetContentProps) {
  return (
    <SheetPrimitive.Portal>
      <SheetOverlay />
      <SheetPrimitive.Content
        className={cn(
          "fixed z-50 h-full w-full max-w-md border-[#1F2937] bg-[#111827] p-4 shadow-xl transition-transform",
          side === "left" ? "left-0 top-0 border-r" : "right-0 top-0 ml-auto border-l",
          className,
        )}
        {...props}
      >
        <div>{children}</div>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetTrigger, SheetContent };
