import { GlassCard } from "@/components/ui/glass-card";
import { loadJarvisFactoryData } from "@/lib/factory-client";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const status = await loadJarvisFactoryData();
  const bps = status.catalog?.blueprints ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Blueprints</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Product recipes. Modules stay independent; blueprints select and
          constrain them.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {bps.map((b, i) => (
          <GlassCard key={b.id} delay={i * 0.05}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-medium text-white">{b.title}</p>
                <p className="font-mono text-xs text-zinc-500">
                  {b.id} · v{b.version}
                </p>
              </div>
              {b.golden ? (
                <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                  Golden
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-zinc-500">Required modules</p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-zinc-300">
              {b.required_modules.join(" → ")}
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              Min reuse {(b.min_module_reuse_rate * 100).toFixed(0)}% · Quality{" "}
              {b.quality_score}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
