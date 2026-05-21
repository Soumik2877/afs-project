"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AppModalProps {
  title: string;
  trigger?: React.ReactNode;
  triggerLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

/** Minimal modal wrapper reused across admin/driver flows */
export function AppModal({
  title,
  trigger,
  triggerLabel = "Open",
  children,
  footer,
  className,
  defaultOpen,
}: AppModalProps) {
  const [open, setOpen] = React.useState(!!defaultOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ?? (
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto border-[#1F2937] bg-[#111827]", className)}>
        <DialogHeader>
          <DialogTitle className="font-display text-lg text-[#F9FAFB]">{title}</DialogTitle>
        </DialogHeader>
        <div>{children}</div>
        {footer ? <DialogFooter className="pt-4">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
