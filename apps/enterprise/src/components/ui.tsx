import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
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
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </div>
      <div className="metric-value mt-1">{value}</div>
      {hint ? <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
}

export function Section({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card", className)}>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-[var(--muted)]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

export function StatusPill({
  status,
}: {
  status: string;
}) {
  const tone =
    /ready|approved|deployed|maintenance|paid|eligible/i.test(status)
      ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
      : /pending|lead|open|tracking|draft/i.test(status)
        ? "text-amber-200 border-amber-500/30 bg-amber-500/10"
        : "text-sky-200 border-sky-500/30 bg-sky-500/10";
  return (
    <span className={cn("badge", tone)}>{status.replaceAll("_", " ")}</span>
  );
}
