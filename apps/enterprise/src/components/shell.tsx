"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  ChartLine,
  Factory,
  Headphones,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/consult", label: "Jarvis Consulting", icon: Briefcase },
  { href: "/business", label: "Business OS · Pipeline", icon: Briefcase },
  { href: "/portal", label: "Client Portal · Trust", icon: Users },
  { href: "/ops", label: "Operations", icon: Building2 },
  { href: "/delivery", label: "Delivery & Support", icon: Headphones },
  { href: "/marketing", label: "Marketing Intel", icon: Megaphone },
  { href: "/kpis", label: "Business KPIs", icon: ChartLine },
  { href: "/governance", label: "Delivery Governance", icon: ShieldCheck },
];

export function EnterpriseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[rgba(7,9,15,0.85)] p-4 backdrop-blur">
        <div className="mb-6 px-2">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
            <Factory className="h-4 w-4 text-sky-400" />
            Grabber Enterprise
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            v3.0 · Track B · Core frozen
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-link", active && "active")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3 text-xs text-[var(--muted)]">
          <div className="mb-1 font-medium text-[var(--text)]">Feature filter</div>
          Discovery · Conversion · Delivery · Margin · Reuse
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[rgba(7,9,15,0.7)] px-6 py-3 backdrop-blur">
          <div className="text-sm text-[var(--muted)]">
            AI-native software company OS
          </div>
          <div className="flex items-center gap-2">
            <span className="badge">
              <span className="stage-dot" /> Core 1.8 frozen
            </span>
            <span className="badge">Factory 2.0</span>
          </div>
        </header>
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
