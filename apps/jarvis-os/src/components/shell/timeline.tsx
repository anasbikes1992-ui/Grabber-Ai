"use client";

import { ACTIVITY_FEED } from "@/lib/nav";

export function Timeline() {
  return (
    <footer className="glass relative z-20 flex h-12 shrink-0 items-center gap-4 overflow-hidden border-t border-white/5 px-4">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Timeline
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto jarvis-scroll">
        {ACTIVITY_FEED.map((a) => (
          <div
            key={a.id}
            className="flex shrink-0 items-center gap-2 text-xs text-zinc-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70" />
            <span className="text-zinc-300">{a.text}</span>
            <span className="text-zinc-600">{a.t}</span>
          </div>
        ))}
      </div>
    </footer>
  );
}
