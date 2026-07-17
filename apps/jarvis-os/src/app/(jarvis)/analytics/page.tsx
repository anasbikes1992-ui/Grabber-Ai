import { MetricTile } from "@/components/ui/glass-card";
import { loadJarvisFactoryData } from "@/lib/factory-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const status = await loadJarvisFactoryData();
  const b = status.analytics?.builds;
  const trends = status.analytics?.trends ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Factory metrics that compound quality — not vanity dashboards.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Avg duration"
          value={`${Math.round(b?.avg_duration_ms ?? 0)}ms`}
        />
        <MetricTile
          label="Avg cost"
          value={`$${(b?.avg_cost_usd ?? 0).toFixed(3)}`}
          accent="violet"
        />
        <MetricTile
          label="DNA completeness"
          value={`${(b?.avg_dna_completeness ?? 0).toFixed(0)}%`}
          accent="blue"
        />
        <MetricTile
          label="Deploy success"
          value={`${((b?.deployment_success_rate ?? 0) * 100).toFixed(0)}%`}
        />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Builds</th>
              <th className="px-4 py-3">Reuse</th>
              <th className="px-4 py-3">Valid %</th>
              <th className="px-4 py-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {trends.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-zinc-500">
                  No trend series yet — run factory builds to populate.
                </td>
              </tr>
            ) : (
              trends.map((t) => (
                <tr key={t.date} className="border-t border-white/5">
                  <td className="px-4 py-2">{t.date}</td>
                  <td className="px-4 py-2">{t.builds}</td>
                  <td className="px-4 py-2">
                    {(t.avg_reuse * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-2">
                    {(t.validation_pass_rate * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-2">
                    {Math.round(t.avg_duration_ms)}ms
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
