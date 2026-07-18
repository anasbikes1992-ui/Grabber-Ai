"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  ChartLine,
  Factory,
  Headphones,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { signOut } from "@/app/actions/auth";

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    label: "Overview",
    items: [
      { href: "/command-center", label: "Command Center", icon: LayoutDashboard },
      { href: "/kpis", label: "Business KPIs", icon: ChartLine },
    ],
  },
  {
    label: "Engagements",
    items: [
      { href: "/consult", label: "Jarvis Consulting", icon: Sparkles },
      { href: "/business", label: "Business OS · Pipeline", icon: Briefcase },
      { href: "/governance", label: "Delivery Governance", icon: ShieldCheck },
      { href: "/portal", label: "Client Portal", icon: Users },
      { href: "/clients", label: "Clients & Access", icon: UserCog },
    ],
  },
  {
    label: "Operate",
    items: [
      { href: "/ops", label: "Operations", icon: Building2 },
      { href: "/delivery", label: "Delivery & Support", icon: Headphones },
      { href: "/marketing", label: "Marketing Intel", icon: Megaphone },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings & Monitoring", icon: Settings }],
  },
];

export function EnterpriseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-(--border) bg-[rgba(6,8,15,0.72)] p-4 backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-2.5 px-1">
          <span className="brand-mark">
            <Factory className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              Grabber <span className="text-gradient">Studio</span>
            </div>
            <p className="text-[0.68rem] text-(--muted)">Consulting & delivery</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="nav-group">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/command-center"
                    ? pathname === "/command-center"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("nav-link", active && "active")}
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-rail"
                        className="nav-rail"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <form action={signOut} className="mt-3">
          <button type="submit" className="nav-link w-full text-left">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border) bg-[rgba(6,8,15,0.6)] px-6 py-3 backdrop-blur-xl">
          <div className="eyebrow">AI-native consulting &amp; delivery</div>
          <div className="flex items-center gap-2">
            <span className="badge gap-1.5">
              <span className="stage-dot" /> Operational
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
