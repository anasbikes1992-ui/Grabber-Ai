import { cn } from "@/lib/cn";

/** Lead → proposal commercial stages (Business OS). */
export const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", match: (e: EngLike) => e.status === "lead" },
  {
    id: "discovery",
    label: "Discovery",
    match: (e: EngLike) =>
      e.status === "discovery" ||
      e.governance_stage === "discovery" ||
      Boolean(
        e.consulting && !e.consulting?.ready_for_intelligence && !e.commercial,
      ),
  },
  {
    id: "analysis",
    label: "Analysis",
    match: (e: EngLike) =>
      Boolean(e.analysis || e.consulting?.gap_analysis) && !e.commercial,
  },
  {
    id: "proposal",
    label: "Proposal",
    match: (e: EngLike) =>
      Boolean(e.commercial) &&
      !e.approvals?.client &&
      e.governance_stage !== "factory_ready",
  },
  {
    id: "approval",
    label: "Approval",
    match: (e: EngLike) =>
      Boolean(e.approvals?.client || e.approvals?.internal) &&
      !e.factory_eligible,
  },
  {
    id: "ready",
    label: "Factory ready",
    match: (e: EngLike) => Boolean(e.factory_eligible),
  },
] as const;

export type EngLike = {
  id: string;
  client_name: string;
  industry?: string;
  status?: string;
  governance_stage?: string;
  factory_eligible?: boolean;
  analysis?: unknown;
  commercial?: { pricing?: { total?: number; deposit?: number } };
  approvals?: { client?: unknown; internal?: unknown; deposit?: unknown };
  consulting?: {
    ready_for_intelligence?: boolean;
    confidence?: number;
    stage?: string;
    gap_analysis?: unknown;
  };
  contact_email?: string;
};

export function stageOf(e: EngLike): string {
  // order matters — most advanced first
  if (e.factory_eligible) return "ready";
  if (e.approvals?.client || e.governance_stage === "client_approval") {
    if (!e.approvals?.deposit && e.governance_stage !== "deposit_received") {
      return "approval";
    }
    if (e.approvals?.deposit || e.governance_stage === "deposit_received") {
      return e.factory_eligible ? "ready" : "approval";
    }
    return "approval";
  }
  if (e.commercial) return "proposal";
  if (e.analysis || e.consulting?.gap_analysis) return "analysis";
  if (e.status === "lead") return "lead";
  if (
    e.governance_stage === "discovery" ||
    e.status === "discovery" ||
    e.consulting
  ) {
    return "discovery";
  }
  return "lead";
}

export function PipelineStepper({
  current,
  className,
}: {
  current: string;
  className?: string;
}) {
  const ids = PIPELINE_STAGES.map((s) => s.id);
  const idx = Math.max(0, ids.indexOf(current as (typeof ids)[number]));

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {PIPELINE_STAGES.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <div
            key={s.id}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              done && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
              active && "border-sky-400/40 bg-sky-500/15 text-sky-100",
              !done && !active && "border-[var(--border)] text-[var(--muted)]",
            )}
          >
            <span className="font-mono opacity-70">{i + 1}</span>
            {s.label}
          </div>
        );
      })}
    </div>
  );
}

export function money(n?: number) {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString()}`;
}
