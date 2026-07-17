import { GlassCard } from "@/components/ui/glass-card";
import { FactoryPipeline } from "@/components/views/factory-pipeline";

export default function BuildersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Builders</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Deterministic artifact builders sequenced by Grabber Core. Jarvis
          visualizes — does not execute.
        </p>
      </div>
      <GlassCard>
        <FactoryPipeline activeIndex={2} />
      </GlassCard>
      <div className="grid gap-3 md:grid-cols-3">
        {["Discovery", "Architecture", "API", "Database", "Frontend", "Backend", "Tests", "Security", "Deploy"].map(
          (b, i) => (
            <GlassCard key={b} delay={i * 0.03} className="!py-3">
              <p className="text-sm font-medium">{b} Builder</p>
              <p className="mt-1 text-xs text-zinc-500">Core · deterministic</p>
            </GlassCard>
          ),
        )}
      </div>
    </div>
  );
}
