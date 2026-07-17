import { GlassCard } from "@/components/ui/glass-card";

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Automation</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Factory automation controls. Scheduling stays on Core IEP — Jarvis
          issues intents only.
        </p>
      </div>
      <GlassCard>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li>Nightly golden reference regeneration</li>
          <li>DNA confidence alerts</li>
          <li>Module reuse regression gates</li>
          <li>Deployment dry-run reports</li>
        </ul>
      </GlassCard>
    </div>
  );
}
