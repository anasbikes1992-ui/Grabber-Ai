import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { label: "Discovery" },
  { label: "Blueprint" },
  { label: "Proposal" },
  { label: "Approval" },
  { label: "Payment" },
  { label: "In delivery" },
  { label: "Live" },
];

// Governance stage → the highest step index reached.
const STAGE_TO_STEP: Record<string, number> = {
  discovery: 0,
  business_analysis: 0,
  solution_design: 1,
  commercial_review: 2,
  risk_review: 3,
  legal_review: 3,
  internal_approval: 3,
  client_approval: 3,
  deposit_received: 5,
  factory_ready: 5,
  deployed: 6,
  live: 6,
};

export function StageProgress({
  stage,
  clientApproved,
  depositPaid,
}: {
  stage?: string;
  clientApproved?: boolean;
  depositPaid?: boolean;
}) {
  let current = stage && STAGE_TO_STEP[stage] != null ? STAGE_TO_STEP[stage] : 0;
  if (clientApproved && current < 3) current = 3;
  if (depositPaid && current < 5) current = 5;

  return (
    <div className="card mb-4">
      <div className="eyebrow mb-3">Your engagement</div>
      <ol className="flex items-center gap-1 overflow-x-auto">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.label} className="flex min-w-0 flex-1 items-center gap-1">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                    done && "border-transparent bg-emerald-500/20 text-emerald-300",
                    active && "border-transparent text-[#05070d]",
                    !done && !active && "border-(--border) text-(--muted)",
                  )}
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(135deg, rgba(56,189,248,0.95), rgba(167,139,250,0.95))",
                          boxShadow: "var(--glow)",
                        }
                      : undefined
                  }
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[0.68rem] leading-tight",
                    active ? "font-medium text-(--text)" : "text-(--muted)",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 ? (
                <span
                  className={cn(
                    "mx-1 h-px flex-1 self-start mt-4 transition-colors",
                    i < current ? "bg-emerald-500/40" : "bg-(--border)",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
