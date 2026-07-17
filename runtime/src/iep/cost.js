// Cost Engine — estimate vs actual per execution (EDR-006).

/** Default USD per 1K tokens (placeholder rates; replace via config). */
const DEFAULT_RATES = Object.freeze({
  'stub': 0,
  'gpt-class': 0.01,
  'claude-class': 0.015,
  'local': 0,
});

export class CostEngine {
  #rates;
  #ledger = [];

  constructor({ rates = DEFAULT_RATES } = {}) {
    this.#rates = { ...DEFAULT_RATES, ...rates };
  }

  estimate({ model = 'stub', estimatedTokens = 0 } = {}) {
    const rate = this.#rates[model] ?? this.#rates['gpt-class'] ?? 0.01;
    const estimated_cost = (estimatedTokens / 1000) * rate;
    return {
      estimated_tokens: estimatedTokens,
      estimated_cost,
      model,
      rate_per_1k: rate,
    };
  }

  /**
   * Record actual execution cost.
   * @returns {object} cost record
   */
  record({
    executionId,
    projectId = null,
    model = 'stub',
    estimatedTokens = 0,
    actualTokens = 0,
    durationMs = 0,
    modelsUsed = null,
  }) {
    const est = this.estimate({ model, estimatedTokens });
    const rate = this.#rates[model] ?? est.rate_per_1k;
    const actual_cost = (actualTokens / 1000) * rate;
    const row = Object.freeze({
      executionId,
      projectId,
      model,
      models_used: modelsUsed ?? [model],
      estimated_tokens: estimatedTokens,
      actual_tokens: actualTokens,
      estimated_cost: est.estimated_cost,
      actual_cost,
      duration_ms: durationMs,
      at: new Date().toISOString(),
    });
    this.#ledger.push(row);
    return row;
  }

  forExecution(executionId) {
    return this.#ledger.filter((r) => r.executionId === executionId);
  }

  totals({ projectId } = {}) {
    const rows = this.#ledger.filter((r) => !projectId || r.projectId === projectId);
    return {
      executions: rows.length,
      actual_cost: rows.reduce((s, r) => s + r.actual_cost, 0),
      estimated_cost: rows.reduce((s, r) => s + r.estimated_cost, 0),
      actual_tokens: rows.reduce((s, r) => s + r.actual_tokens, 0),
      estimated_tokens: rows.reduce((s, r) => s + r.estimated_tokens, 0),
    };
  }

  get ledger() {
    return [...this.#ledger];
  }
}
