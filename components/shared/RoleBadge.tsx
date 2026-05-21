"use client";

import { HeartHandshake, ShieldHalf, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const meta: Record<
  UserRole,
  {
    Icon: typeof Truck;
    accent: string;
  }
> = {
  admin: { Icon: ShieldHalf, accent: "text-purple-300" },
  driver: { Icon: Truck, accent: "text-sky-300" },
  citizen: { Icon: HeartHandshake, accent: "text-emerald-300" },
};

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { Icon, accent } = meta[role];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[#1F2937] px-3 py-1 text-xs uppercase tracking-[0.2em]",
        accent,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {role}
    </span>
  );
}
