import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "Mission Control" },
  { href: "/admin/bins", label: "Bin Mesh" },
  { href: "/admin/routes", label: "Route Studio" },
  { href: "/admin/fleet", label: "Live Fleet" },
  { href: "/admin/complaints", label: "Complaints" },
  { href: "/admin/decomposition", label: "Decomposition" },
  { href: "/admin/reports", label: "Reports" },
];

interface AdminSidebarProps {
  activePath?: string;
}

export function AdminSidebar({ activePath }: AdminSidebarProps) {
  return (
    <aside className="hidden w-72 flex-col gap-10 border-r border-[#1F2937] bg-[#090f1d] px-5 py-8 text-[#CBD5F5] lg:flex">
      <div>
        <p className="text-xs uppercase tracking-[0.6em] text-emerald-300">Neo-Waste</p>
        <p className="font-display text-3xl font-semibold text-white">HQ Console</p>
      </div>
      <nav className="flex flex-1 flex-col gap-2 text-sm">
        {LINKS.map((link) => {
          const active =
            activePath === link.href || (link.href !== "/admin" && activePath?.startsWith(link.href));

          return (
            <Link
              key={link.href}
              prefetch
              href={link.href}
              className={
                active
                  ? "rounded-xl bg-emerald-500/15 px-4 py-3 font-semibold text-emerald-200 ring-1 ring-emerald-500/35"
                  : "rounded-xl px-4 py-3 text-[#94A3B8] hover:bg-[#111827]"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <p className="text-xs text-[#6B7280]">Fleet desk · fleet@neo-waste.city</p>
    </aside>
  );
}
