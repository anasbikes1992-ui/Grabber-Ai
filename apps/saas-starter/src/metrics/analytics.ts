/**
 * Factory Analytics — history, trends, rollups for commercial dashboard.
 */
import { listFactoryMetrics, type FactoryMetricsRecord } from "./factory-metrics";
import { listProducts } from "@/products";
import { buildFactoryCatalog } from "@/factory/registry-v2";

export type TrendPoint = {
  date: string;
  builds: number;
  avg_reuse: number;
  avg_duration_ms: number;
  validation_pass_rate: number;
  avg_cost: number;
  interventions: number;
};

export type AnalyticsDashboard = {
  version: string;
  generated_at: string;
  catalog: ReturnType<typeof buildFactoryCatalog>["summary"];
  products: {
    total: number;
    by_status: Record<string, number>;
  };
  builds: {
    total: number;
    validation_pass_rate: number;
    avg_duration_ms: number;
    avg_module_reuse_rate: number;
    avg_dna_confidence: number;
    avg_dna_completeness: number;
    avg_interventions: number;
    avg_cost_usd: number;
    deployment_success_rate: number;
  };
  history: FactoryMetricsRecord[];
  trends: TrendPoint[];
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function buildAnalyticsDashboard(
  cwd = process.cwd(),
  opts: { historyLimit?: number } = {},
): AnalyticsDashboard {
  const historyAll = listFactoryMetrics(cwd);
  const history = historyAll.slice(-(opts.historyLimit ?? 100)).reverse();
  const catalog = buildFactoryCatalog(cwd);
  const products = listProducts(cwd, { includeArchived: true });

  const by_status: Record<string, number> = {};
  for (const p of products) {
    by_status[p.status] = (by_status[p.status] ?? 0) + 1;
  }

  const n = historyAll.length || 1;
  const sum = (fn: (r: FactoryMetricsRecord) => number) =>
    historyAll.reduce((s, r) => s + fn(r), 0);

  const trendsMap = new Map<string, FactoryMetricsRecord[]>();
  for (const r of historyAll) {
    const k = dayKey(r.at);
    if (!trendsMap.has(k)) trendsMap.set(k, []);
    trendsMap.get(k)!.push(r);
  }

  const trends: TrendPoint[] = [...trendsMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => {
      const m = rows.length || 1;
      return {
        date,
        builds: rows.length,
        avg_reuse:
          rows.reduce((s, r) => s + (r.module_reuse_rate ?? 0), 0) / m,
        avg_duration_ms:
          rows.reduce((s, r) => s + r.build_duration_ms, 0) / m,
        validation_pass_rate:
          rows.filter((r) => r.validation_pass).length / m,
        avg_cost:
          rows.reduce((s, r) => s + (r.total_build_cost_usd ?? 0), 0) / m,
        interventions: rows.reduce((s, r) => s + r.manual_interventions, 0),
      };
    });

  return {
    version: "2.0.0",
    generated_at: new Date().toISOString(),
    catalog: catalog.summary,
    products: {
      total: products.filter((p) => p.status !== "archived").length,
      by_status,
    },
    builds: {
      total: historyAll.length,
      validation_pass_rate:
        historyAll.length === 0
          ? 1
          : historyAll.filter((r) => r.validation_pass).length /
            historyAll.length,
      avg_duration_ms: sum((r) => r.build_duration_ms) / n,
      avg_module_reuse_rate:
        sum((r) => r.module_reuse_rate ?? 0) /
        (historyAll.filter((r) => r.module_reuse_rate != null).length || n),
      avg_dna_confidence: sum((r) => r.dna_confidence) / n,
      avg_dna_completeness: sum((r) => r.dna_completeness) / n,
      avg_interventions: sum((r) => r.manual_interventions) / n,
      avg_cost_usd: sum((r) => r.total_build_cost_usd ?? 0) / n,
      deployment_success_rate:
        historyAll.length === 0
          ? 0
          : historyAll.filter((r) => r.deployment_success).length /
            historyAll.length,
    },
    history,
    trends,
  };
}
