import { GlassCard, MetricTile } from "@/components/ui/glass-card";
import { FactoryPipeline } from "@/components/views/factory-pipeline";
import { loadJarvisFactoryData } from "@/lib/factory-client";
import { StatusDot } from "@/components/ui/status-dot";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const status = await loadJarvisFactoryData();
  const b = status.analytics?.builds;
  const c = status.catalog?.summary;

  return (
    <div className="space-y-6" data-testid="jarvis-dashboard">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Command center
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Factory health and wall KPI —{" "}
          <span className="text-cyan-300/90">DNA → production</span>. Jarvis
          surfaces Product Factory state; Grabber Core stays frozen.
        </p>
        <div className="mt-3">
          <StatusDot
            online={status.online}
            label={
              status.online
                ? "Product Factory host online"
                : status.error ?? "Demo metrics"
            }
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Wall KPI · validation"
          value={`${((b?.validation_pass_rate ?? 1) * 100).toFixed(0)}%`}
          hint="Build validation pass rate"
          delay={0.05}
        />
        <MetricTile
          label="Module reuse"
          value={`${((b?.avg_module_reuse_rate ?? 1) * 100).toFixed(0)}%`}
          hint="Catalog assembly efficiency"
          accent="violet"
          delay={0.1}
        />
        <MetricTile
          label="DNA confidence"
          value={`${(b?.avg_dna_confidence ?? 94).toFixed(0)}%`}
          hint="Intake certainty before build"
          accent="blue"
          delay={0.15}
        />
        <MetricTile
          label="Interventions"
          value={(b?.avg_interventions ?? 0).toFixed(2)}
          hint="Avg manual interventions / build"
          delay={0.2}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Modules"
          value={c?.module_count ?? 18}
          hint={`Quality ${c?.avg_module_quality ?? 100}`}
          delay={0.22}
        />
        <MetricTile
          label="Blueprints"
          value={c?.blueprint_count ?? 5}
          hint={`${c?.golden_count ?? 4} golden`}
          accent="violet"
          delay={0.24}
        />
        <MetricTile
          label="Builds"
          value={b?.total ?? 0}
          hint={`Cost $${(b?.avg_cost_usd ?? 0).toFixed(3)} avg`}
          accent="blue"
          delay={0.26}
        />
        <MetricTile
          label="Deploy success"
          value={`${((b?.deployment_success_rate ?? 0) * 100).toFixed(0)}%`}
          hint={`Duration ~${Math.round(b?.avg_duration_ms ?? 0)}ms`}
          delay={0.28}
        />
      </div>

      <GlassCard delay={0.3}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Factory pipeline</p>
            <p className="text-xs text-zinc-500">
              Live builder stages · Core sequences these
            </p>
          </div>
        </div>
        <FactoryPipeline activeIndex={3} />
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard delay={0.35}>
          <p className="text-sm font-medium">System status</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li className="flex justify-between">
              <span>Grabber Core</span>
              <span className="text-cyan-300">Frozen · healthy</span>
            </li>
            <li className="flex justify-between">
              <span>Product Factory</span>
              <span className="text-violet-300">v2.0</span>
            </li>
            <li className="flex justify-between">
              <span>Jarvis OS</span>
              <span className="text-zinc-200">Phase 3</span>
            </li>
            <li className="flex justify-between">
              <span>Factory host</span>
              <span className="font-mono text-xs">
                {status.online ? "live" : "demo"}
              </span>
            </li>
          </ul>
        </GlassCard>
        <GlassCard delay={0.4}>
          <p className="text-sm font-medium">Mission filter</p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Features that do not make{" "}
            <span className="text-cyan-300/90">
              DNA → validated production
            </span>{" "}
            faster, more reliable, more deterministic, or lower cost do not
            belong in Core — only in modules, blueprints, or Jarvis.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
