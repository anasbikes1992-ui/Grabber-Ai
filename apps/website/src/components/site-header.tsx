"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/journey", label: "Journey" },
  { href: "/#industries", label: "Industries" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onConsult = pathname?.startsWith("/consult");
  const onBook = pathname?.startsWith("/book");

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(5,7,12,0.75)] backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/30 to-violet-500/30 ring-1 ring-white/10">
            <Sparkles className="h-4 w-4 text-sky-300" />
          </span>
          Grabber
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/book"
            className={cn("btn btn-ghost text-sm hidden sm:inline-flex", onBook && "ring-1 ring-white/20")}
          >
            Book
          </Link>
          <Link
            href="/consult"
            className={cn("btn btn-primary text-sm", onConsult && "ring-2 ring-sky-400/40")}
          >
            Start discovery
          </Link>
        </div>
      </div>
    </header>
  );
}
