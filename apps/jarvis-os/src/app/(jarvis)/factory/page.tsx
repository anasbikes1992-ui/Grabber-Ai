import { GlassCard } from "@/components/ui/glass-card";
import { FactoryPipeline } from "@/components/views/factory-pipeline";
import { loadJarvisFactoryData } from "@/lib/factory-client";

export const dynamic = "force-dynamic";

export default async function FactoryPage() {
  const status = await loadJarvisFactoryData();
  const history = status.analytics?.history?.slice(0, 8) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Factory</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Live manufacturing view. Builders run on Grabber Core — Jarvis only
          observes and commands.
        </p>
      </div>

      <GlassCard>
        <p className="mb-4 text-sm font-medium">Active pipeline</p>
        <FactoryPipeline activeIndex={5} />
      </GlassCard>

      <GlassCard>
        <p className="mb-3 text-sm font-medium">Recent builds</p>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No history from factory host. Start{" "}
            <code className="text-xs text-cyan-300">apps/saas-starter</code> on
            :3000 for live data.
          </p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/25 px-3 py-2 text-sm"
              >
                <span className="font-medium text-zinc-200">
                  {h.project_name}
                </span>
                <span className="font-mono text-xs text-zinc-500">
                  {h.at.slice(0, 19)}
                </span>
                <span className="text-xs text-zinc-400">
                  reuse{" "}
                  {h.module_reuse_rate != null
                    ? `${(h.module_reuse_rate * 100).toFixed(0)}%`
                    : "—"}{" "}
                  · {h.build_duration_ms}ms ·{" "}
                  {h.validation_pass ? (
                    <span className="text-cyan-300">valid</span>
                  ) : (
                    <span className="text-amber-300">failed</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
