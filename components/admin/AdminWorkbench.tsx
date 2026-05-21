"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/SignOutButton";

import { AdminSidebar } from "./AdminSidebar";
import { NotificationBell } from "../shared/NotificationBell";

export function AdminWorkbench({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#070b17]">
      <AdminSidebar activePath={pathname} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[#111827] bg-[#0A0F1E]/95 px-4 py-5 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#64748b]">{pathname ?? "/admin"}</p>
            <p className="font-display text-2xl">Operations overview</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell unread={4} />
            <Link prefetch href="/admin/routes">
              <button
                type="button"
                className="rounded-lg border border-transparent bg-emerald-500 px-4 py-2 text-[#031512]"
              >
                Create Route
              </button>
            </Link>
            <SignOutButton variant="outline" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 lg:p-10">{children}</main>
      </div>
      <MobileAdminNav pathname={pathname} />
    </div>
  );
}

function MobileAdminNav({ pathname }: { pathname: string | null }) {
  return (
    <div className="fixed bottom-5 left-5 right-5 z-40 flex gap-2 rounded-xl border border-[#1F2937] bg-[#0F172A] p-3 text-[11px] text-[#9CA3AF] shadow-xl lg:hidden">
      <Quick href="/admin" active={pathname === "/admin"}>
        HQ
      </Quick>
      <Quick href="/admin/fleet" active={pathname?.startsWith("/admin/fleet")}>
        Fleet
      </Quick>
      <Quick href="/admin/bins" active={pathname?.startsWith("/admin/bins")}>
        Bins
      </Quick>
    </div>
  );
}

function Quick({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link prefetch href={href} className={active ? "text-emerald-300" : undefined}>
      <div className="flex flex-1 items-center justify-center rounded-lg px-3 py-2 font-semibold hover:bg-black/35">
        {children}
      </div>
    </Link>
  );
}
