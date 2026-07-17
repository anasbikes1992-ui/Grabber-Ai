import { GlassCard } from "@/components/ui/glass-card";
import { factoryBaseUrl } from "@/lib/factory-client";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Jarvis OS configuration. Core remains untouched.
        </p>
      </div>
      <GlassCard>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Factory host URL</dt>
            <dd className="font-mono text-xs text-cyan-300">
              {factoryBaseUrl()}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Env var</dt>
            <dd className="font-mono text-xs text-zinc-400">
              NEXT_PUBLIC_FACTORY_URL
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Jarvis version</dt>
            <dd className="text-zinc-300">0.3.0 · Phase 3</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Grabber Core</dt>
            <dd className="text-zinc-300">1.8.x frozen</dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  );
}
