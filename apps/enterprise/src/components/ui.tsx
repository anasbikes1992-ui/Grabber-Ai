import { cn } from "@/lib/cn";
import { AnimatedNumber, TiltCard } from "@/components/motion-ui";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
        <h1 className="text-[1.7rem] font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  trend?: { value: string; direction?: "up" | "down" };
}) {
  return (
    <TiltCard className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </div>
      {trend ? (
        <div className={cn("kpi-trend", trend.direction ?? "up")}>
          {trend.direction === "down" ? "▾" : "▴"} {trend.value}
        </div>
      ) : null}
      {hint ? <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div> : null}
    </TiltCard>
  );
}

export function Section({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("card", className)}>
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-sm font-semibold tracking-wide text-[var(--text)]">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(255,255,255,0.015)] p-10 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = /ready|approved|deployed|maintenance|paid|eligible|live/i.test(status)
    ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
    : /pending|lead|open|tracking|draft|review/i.test(status)
      ? "text-amber-200 border-amber-500/30 bg-amber-500/10"
      : /block|fail|overdue|risk|reject/i.test(status)
        ? "text-red-300 border-red-500/30 bg-red-500/10"
        : "text-sky-200 border-sky-500/30 bg-sky-500/10";
  return (
    <span className={cn("badge gap-1.5", tone)}>
      <span className="pill-dot" />
      {status.replaceAll("_", " ")}
    </span>
  );
}
