"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";

const GROUPS: { id: string; label: string }[] = [
  { id: "main", label: "Command" },
  { id: "factory", label: "Factory" },
  { id: "ops", label: "Operations" },
  { id: "growth", label: "Growth" },
  { id: "system", label: "System" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass relative z-10 flex w-56 shrink-0 flex-col border-r border-white/5">
      <nav className="jarvis-scroll flex-1 space-y-5 overflow-y-auto p-3">
        {GROUPS.map((g) => {
          const items = NAV.filter((n) => n.group === g.id);
          if (!items.length) return null;
          return (
            <div key={g.id}>
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                {g.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition",
                          active
                            ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]"
                            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-cyan-300" : "text-zinc-500 group-hover:text-zinc-300",
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/5 p-3">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600">
          Core
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">Frozen · v1.8.x</p>
      </div>
    </aside>
  );
}
