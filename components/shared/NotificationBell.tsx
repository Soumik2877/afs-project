"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NotificationBellProps {
  unread?: number;
}

export function NotificationBell({ unread = 0 }: NotificationBellProps) {
  return (
    <Button variant="ghost" size="sm" className="relative border border-transparent hover:border-[#1F2937]">
      <Bell className="h-4 w-4" />
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-[#031512]">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Button>
  );
}
