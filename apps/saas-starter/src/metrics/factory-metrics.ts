/**
 * Factory Metrics — structured KPIs for every build (Sprint 4+).
 * Complements wall KPI: DNA → validated deployable application.
 */
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type FactoryMetricsRecord = {
  id: string;
  at: string;
  project_name: string;
  product_fingerprint?: string;
  /** Intake quality */
  dna_completeness: number;
  dna_confidence: number;
  clarifications_required: number;
  /** Factory */
  build_duration_ms: number;
  validation_pass: boolean;
  manual_interventions: number;
  regeneration_equivalent?: boolean;
  deployment_success?: boolean;
  total_build_cost_usd?: number;
  /** Integration layer */
  integrations_planned: string[];
  integrations_dry_run: boolean;
  production_url?: string;
  /** Sprint 5 — module assembly */
  module_reuse_rate?: number;
  modules_assembled?: number;
  modules_requested?: number;
  /** Free-form extras */
  notes?: string[];
};

export type FactoryMetricsSummary = {
  builds: number;
  avg_dna_completeness: number;
  avg_dna_confidence: number;
  avg_build_duration_ms: number;
  validation_pass_rate: number;
  avg_interventions: number;
  deployment_success_rate: number;
  avg_cost_usd: number;
  avg_module_reuse_rate: number;
};

function metricsPath(cwd = process.cwd()): string {
  return join(cwd, ".grabber", "factory-metrics.jsonl");
}

export function recordFactoryMetrics(
  partial: Omit<FactoryMetricsRecord, "id" | "at">,
  cwd = process.cwd(),
): FactoryMetricsRecord {
  const record: FactoryMetricsRecord = {
    id: createHash("sha256")
      .update(`${partial.project_name}:${Date.now()}:${Math.random()}`)
      .digest("hex")
      .slice(0, 12),
    at: new Date().toISOString(),
    ...partial,
  };

  const path = metricsPath(cwd);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

export function listFactoryMetrics(cwd = process.cwd()): FactoryMetricsRecord[] {
  const path = metricsPath(cwd);
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as FactoryMetricsRecord);
}

export function summarizeFactoryMetrics(
  cwd = process.cwd(),
): FactoryMetricsSummary {
  const rows = listFactoryMetrics(cwd);
  const n = rows.length || 1;
  const sum = (fn: (r: FactoryMetricsRecord) => number) =>
    rows.reduce((s, r) => s + fn(r), 0);

  return {
    builds: rows.length,
    avg_dna_completeness: sum((r) => r.dna_completeness) / n,
    avg_dna_confidence: sum((r) => r.dna_confidence) / n,
    avg_build_duration_ms: sum((r) => r.build_duration_ms) / n,
    validation_pass_rate:
      rows.length === 0
        ? 1
        : rows.filter((r) => r.validation_pass).length / rows.length,
    avg_interventions: sum((r) => r.manual_interventions) / n,
    deployment_success_rate:
      rows.length === 0
        ? 0
        : rows.filter((r) => r.deployment_success).length / rows.length,
    avg_cost_usd: sum((r) => r.total_build_cost_usd ?? 0) / n,
    avg_module_reuse_rate:
      sum((r) => r.module_reuse_rate ?? 0) /
      (rows.filter((r) => r.module_reuse_rate != null).length || n),
  };
}

/** Test helper — wipe metrics file. */
export function resetFactoryMetrics(cwd = process.cwd()): void {
  const path = metricsPath(cwd);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "", "utf8");
}
