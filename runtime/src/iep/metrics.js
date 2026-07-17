// Execution metrics aggregator (engineering KPIs, not file counts).
export class MetricsService {
  #series = [];

  record(point) {
    this.#series.push(Object.freeze({
      ...point,
      at: point.at ?? new Date().toISOString(),
    }));
  }

  /**
   * KPI rollup for a project or platform-wide.
   */
  kpis({ projectId } = {}) {
    const rows = this.#series.filter((r) => !projectId || r.projectId === projectId);
    const executions = rows.filter((r) => r.kind === 'execution');
    const failures = executions.filter((r) => r.failed);
    const retries = rows.filter((r) => r.kind === 'retry');
    const policy = rows.filter((r) => r.kind === 'policy_violation');
    const interventions = rows.filter((r) => r.intervention);
    const totalLatency = executions.reduce((s, r) => s + (r.latencyMs ?? 0), 0);
    const totalCost = executions.reduce((s, r) => s + (r.cost ?? 0), 0);
    const selfCorrections = rows.filter((r) => r.kind === 'self_correction');

    return {
      runtime_reliability: executions.length
        ? 1 - (failures.length / executions.length)
        : 1,
      executions: executions.length,
      failures: failures.length,
      retry_rate: executions.length ? retries.length / executions.length : 0,
      self_correction_rate: executions.length ? selfCorrections.length / executions.length : 0,
      avg_latency_ms: executions.length ? Math.round(totalLatency / executions.length) : 0,
      cost_per_execution: executions.length ? totalCost / executions.length : 0,
      total_cost: totalCost,
      policy_violations: policy.length,
      human_intervention_rate: executions.length ? interventions.length / executions.length : 0,
      cache_hit_rate: avg(rows.map((r) => r.cacheHitRate).filter((x) => x != null)),
      artifact_success_rate: rate(rows, 'artifact_ok', 'artifact_total'),
    };
  }

  get all() {
    return [...this.#series];
  }
}

function avg(xs) {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function rate(rows, okKey, totalKey) {
  let ok = 0;
  let total = 0;
  for (const r of rows) {
    if (r[totalKey] != null) {
      total += r[totalKey];
      ok += r[okKey] ?? 0;
    }
  }
  return total ? ok / total : 1;
}
