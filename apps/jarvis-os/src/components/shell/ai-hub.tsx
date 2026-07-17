"use client";

import { motion } from "framer-motion";
import { Bot, Circle } from "lucide-react";

/** Consulting-first phases — software generation is last and gated. */
const PHASES = [
  { id: "discovery", label: "Business discovery", active: true },
  { id: "intel", label: "Industry intelligence", active: false },
  { id: "benchmark", label: "Benchmark (patterns)", active: false },
  { id: "gaps", label: "Gap analysis", active: false },
  { id: "review", label: "Multi-agent review", active: false },
  { id: "package", label: "Solution package", active: false },
  { id: "govern", label: "Governance + deposit", active: false },
  { id: "factory", label: "Product Factory", active: false },
];

export function AiHub() {
  return (
    <aside className="glass relative z-10 hidden w-64 shrink-0 flex-col border-l border-white/5 xl:flex">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <Bot className="h-4 w-4 text-violet-300" />
        <div>
          <p className="text-sm font-medium">Jarvis Consultant</p>
          <p className="text-[10px] text-zinc-500">Business first · not codegen</p>
        </div>
      </div>

      <div className="jarvis-scroll flex-1 space-y-4 overflow-y-auto p-4">
        <div className="relative mx-auto h-28 w-28">
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-violet-400/25"
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-400/20 to-violet-500/30 ring-1 ring-white/10" />
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400">
          Client describes business · Jarvis designs
        </p>

        <ul className="space-y-1.5">
          {PHASES.map((p) => (
            <li
              key={p.id}
              className={
                p.active
                  ? "glass-soft flex items-center gap-2 rounded-xl px-3 py-1.5 pipeline-node-active"
                  : "flex items-center gap-2 rounded-xl px-3 py-1.5 text-zinc-500"
              }
            >
              <Circle
                className={
                  p.active
                    ? "h-2.5 w-2.5 fill-cyan-400 text-cyan-400"
                    : "h-2.5 w-2.5 text-zinc-600"
                }
              />
              <span className="text-xs">{p.label}</span>
            </li>
          ))}
        </ul>

        <div className="glass-soft rounded-xl p-3 text-xs leading-relaxed text-zinc-400">
          Patterns from industry packs &amp; benchmarks —{" "}
          <span className="text-amber-200/90">never copy proprietary code or UIs</span>.
          Factory only after governance.
        </div>
      </div>
    </aside>
  );
}
