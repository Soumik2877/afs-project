"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/SignOutButton";

import { EcoPointsBadge } from "@/components/citizen/EcoPointsBadge";

interface CitizenShellProps {
  ecoPoints?: number | null;
  children: React.ReactNode;
}

const links = [
  { href: "/citizen", label: "Home" },
  { href: "/citizen/report", label: "Report" },
  { href: "/citizen/qr", label: "QR" },
  { href: "/citizen/eco-points", label: "Points" },
];

export function CitizenShell({ ecoPoints = 0, children }: CitizenShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#070b17] via-[#0A0F1E] to-[#030713] pb-28 text-[#E2E8F0]">
      <header className="sticky top-0 z-30 flex items-center gap-6 border-b border-[#162031] bg-[#0A0F1E]/90 px-6 py-4 backdrop-blur">
        <div className="flex-1 font-display text-3xl tracking-tight">Citizen Pulse</div>
        <EcoPointsBadge points={ecoPoints ?? 0} />
        <SignOutButton label="Logout" variant="ghost" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-8">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 grid grid-cols-4 border-t border-[#172033] bg-[#0b1228]/96 py-5 text-[11px] font-semibold uppercase tracking-[0.45em] text-[#8893a7] backdrop-blur">
        {links.map((linkItem) => {
          const active =
            pathname === linkItem.href ||
            (linkItem.href !== "/citizen" && !!pathname && pathname.startsWith(linkItem.href));

          return (
            <Link key={linkItem.href} prefetch href={linkItem.href} className={active ? "text-center text-emerald-300" : "text-center"}>
              <span>{linkItem.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
