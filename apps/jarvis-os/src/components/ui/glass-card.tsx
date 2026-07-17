"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function GlassCard({
  children,
  className,
  float,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  float?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass rounded-2xl p-4",
        float && "float",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  accent = "cyan",
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "cyan" | "violet" | "blue";
  delay?: number;
}) {
  const ring =
    accent === "violet"
      ? "from-violet-500/20 to-transparent"
      : accent === "blue"
        ? "from-blue-500/20 to-transparent"
        : "from-cyan-500/20 to-transparent";

  return (
    <GlassCard delay={delay} className="relative overflow-hidden">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          ring,
        )}
      />
      <p className="relative text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-400">
        {label}
      </p>
      <p className="relative mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {hint ? (
        <p className="relative mt-1 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </GlassCard>
  );
}
