"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const NODES = [
  "Discovery",
  "Requirements",
  "DNA",
  "Assembly",
  "Frontend",
  "Backend",
  "Testing",
  "Security",
  "Deployment",
];

export function FactoryPipeline({ activeIndex = 3 }: { activeIndex?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {NODES.map((n, i) => {
        const active = i === activeIndex;
        const done = i < activeIndex;
        return (
          <div key={n} className="flex items-center gap-2">
            <motion.div
              layout
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-medium",
                active && "pipeline-node-active bg-cyan-500/15 text-cyan-100",
                done && !active && "bg-white/8 text-zinc-300",
                !done && !active && "bg-black/30 text-zinc-500 ring-1 ring-white/5",
              )}
            >
              {n}
            </motion.div>
            {i < NODES.length - 1 ? (
              <span className="hidden h-px w-4 bg-gradient-to-r from-cyan-500/40 to-violet-500/40 sm:block" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
