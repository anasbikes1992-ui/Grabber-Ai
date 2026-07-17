"use client";

import { Command, Search, Zap } from "lucide-react";
import { StatusDot } from "@/components/ui/status-dot";

export function CommandBar({
  factoryOnline,
  factoryUrl,
}: {
  factoryOnline: boolean;
  factoryUrl: string;
}) {
  return (
    <header className="glass relative z-20 flex h-14 shrink-0 items-center gap-4 border-b border-white/5 px-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 ring-1 ring-white/10">
          <Zap className="h-4 w-4 text-cyan-300" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight">
            <span className="text-gradient">Jarvis OS</span>
          </p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Grabber AI Studio
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-zinc-400">
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Search projects, DNA, modules, blueprints…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline-flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <StatusDot online={factoryOnline} />
        <span className="max-w-[140px] truncate font-mono text-[10px] text-zinc-600">
          {factoryUrl.replace(/^https?:\/\//, "")}
        </span>
      </div>
    </header>
  );
}
