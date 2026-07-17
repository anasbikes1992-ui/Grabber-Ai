import { GlassCard } from "@/components/ui/glass-card";

export default function IntelligencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Intelligence</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Product Intelligence Layer — conversation → requirements → DNA.
          Implementation lives in the Product Factory host.
        </p>
      </div>
      <GlassCard>
        <ol className="space-y-3 text-sm text-zinc-300">
          {[
            "Client conversation",
            "Business discovery",
            "Requirements extraction",
            "Feature classification",
            "Domain + module selection",
            "Rich Project DNA",
            "Confidence gate + human review",
          ].map((step, i) => (
            <li key={step} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/15 font-mono text-xs text-violet-200">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </GlassCard>
      <GlassCard>
        <p className="text-sm text-zinc-400">
          Run intake on the factory host:{" "}
          <code className="text-cyan-300">apps/saas-starter</code> → Dashboard
          → Intake, or{" "}
          <code className="text-cyan-300">POST /api/intake/run</code>.
        </p>
      </GlassCard>
    </div>
  );
}
