"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/SignOutButton";

interface DriverShellProps {
  children: React.ReactNode;
}

const tabs = [
  { href: "/driver", label: "Home" },
  { href: "/driver/checkin", label: "Check-in" },
  { href: "/driver/scan", label: "Scan" },
];

export function DriverShell({ children }: DriverShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-[#050913] pb-24 text-[#E2E8F0]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#1F2937] bg-black/65 px-4 py-5 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.65em] text-emerald-400">Neo-Waste</p>
          <p className="font-display text-2xl">Driver Hub</p>
        </div>
        <SignOutButton variant="ghost" label="Sign out" />
      </header>
      <main className="flex-1 px-4 py-8">{children}</main>
      <nav className="fixed bottom-4 left-4 right-4 z-40 flex justify-around rounded-full border border-[#1F2937] bg-[#0f172d]/95 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#9CA3AF] shadow-xl backdrop-blur">
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/driver" && pathname?.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active ? "text-emerald-300" : "hover:text-emerald-200"}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
