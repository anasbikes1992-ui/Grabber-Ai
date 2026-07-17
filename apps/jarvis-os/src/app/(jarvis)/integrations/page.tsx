import { GlassCard } from "@/components/ui/glass-card";

const STEPS = ["GitHub", "Supabase", "Stripe", "Vercel", "Production URL"];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Integrations</h1>
        <p className="mt-1 text-sm text-zinc-400">
          DNA-driven integration planner — not raw connectors with business
          logic.
        </p>
      </div>
      <GlassCard>
        <div className="flex flex-wrap items-center gap-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 ring-1 ring-cyan-500/30">
                {s}
              </div>
              {i < STEPS.length - 1 ? (
                <span className="text-zinc-600">→</span>
              ) : null}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
