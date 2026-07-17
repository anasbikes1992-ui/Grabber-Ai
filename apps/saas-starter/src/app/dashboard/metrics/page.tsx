import { buildAnalyticsDashboard } from "@/metrics/analytics";

export const dynamic = "force-dynamic";

export default function MetricsPage() {
  const analytics = buildAnalyticsDashboard(process.cwd());
  const { builds, history, trends, catalog, products } = analytics;

  return (
    <div data-testid="metrics-page">
      <h1 className="text-2xl font-semibold tracking-tight">
        Factory analytics
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Build history, reuse, validation, cost, deployments, duration,
        interventions, and trends. Core is frozen — metrics improve the catalog.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Builds", builds.total],
          ["Products", products.total],
          ["Modules", catalog.module_count],
          ["Blueprints", catalog.blueprint_count],
          [
            "Validation pass",
            `${(builds.validation_pass_rate * 100).toFixed(0)}%`,
          ],
          [
            "Avg module reuse",
            `${(builds.avg_module_reuse_rate * 100).toFixed(0)}%`,
          ],
          ["Avg duration", `${Math.round(builds.avg_duration_ms)} ms`],
          ["Avg interventions", builds.avg_interventions.toFixed(2)],
          [
            "Deploy success",
            `${(builds.deployment_success_rate * 100).toFixed(0)}%`,
          ],
          ["Avg cost (USD)", builds.avg_cost_usd.toFixed(4)],
          [
            "Avg DNA confidence",
            `${builds.avg_dna_confidence.toFixed(0)}%`,
          ],
          [
            "Avg DNA completeness",
            `${builds.avg_dna_completeness.toFixed(0)}%`,
          ],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Trends (by day)</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Builds</th>
              <th className="px-3 py-2">Reuse</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Valid %</th>
              <th className="px-3 py-2">Cost</th>
              <th className="px-3 py-2">Interventions</th>
            </tr>
          </thead>
          <tbody>
            {trends.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-zinc-500" colSpan={7}>
                  No trend data yet.
                </td>
              </tr>
            ) : (
              trends.map((t) => (
                <tr
                  key={t.date}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-3 py-2">{t.date}</td>
                  <td className="px-3 py-2">{t.builds}</td>
                  <td className="px-3 py-2">
                    {(t.avg_reuse * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2">
                    {Math.round(t.avg_duration_ms)}ms
                  </td>
                  <td className="px-3 py-2">
                    {(t.validation_pass_rate * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2">{t.avg_cost.toFixed(4)}</td>
                  <td className="px-3 py-2">{t.interventions}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Build history</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Project</th>
              <th className="px-3 py-2">Conf / Comp</th>
              <th className="px-3 py-2">Reuse</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Valid</th>
              <th className="px-3 py-2">URL</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-zinc-500" colSpan={7}>
                  No builds recorded yet.
                </td>
              </tr>
            ) : (
              history.slice(0, 25).map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {r.at.slice(0, 19)}
                  </td>
                  <td className="px-3 py-2">{r.project_name}</td>
                  <td className="px-3 py-2">
                    {r.dna_confidence}% / {r.dna_completeness}%
                  </td>
                  <td className="px-3 py-2">
                    {r.module_reuse_rate != null
                      ? `${(r.module_reuse_rate * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{r.build_duration_ms}ms</td>
                  <td className="px-3 py-2">
                    {r.validation_pass ? "yes" : "no"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.production_url ?? "—"}
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
