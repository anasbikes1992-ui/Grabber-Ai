// telemetry/recorder.js — OB-09/OB-10: every run records routing decisions,
// gate scores, token cost, duration, and human interventions.

export class Telemetry {
  #records = [];

  record({ kind, project, task = '', agent = '', bundle = '', route = '', tokens = 0, durationMs = 0, score = null, intervention = false }) {
    this.#records.push(Object.freeze({
      kind, project, task, agent, bundle, route, tokens, durationMs, score, intervention,
      at: new Date().toISOString(),
    }));
  }

  metrics(project) {
    const rows = this.#records.filter((r) => !project || r.project === project);
    const dispatches = rows.filter((r) => r.kind === 'dispatch');
    const validations = rows.filter((r) => r.kind === 'validation');
    const failed = validations.filter((r) => r.score !== null && r.score < 90);
    return {
      dispatches: dispatches.length,
      validations: validations.length,
      validation_failure_rate: validations.length ? failed.length / validations.length : 0,
      manual_interventions: rows.filter((r) => r.intervention).length,
      token_cost: rows.reduce((s, r) => s + r.tokens, 0),
      avg_duration_ms: dispatches.length ? Math.round(dispatches.reduce((s, r) => s + r.durationMs, 0) / dispatches.length) : 0,
    };
  }

  get all() { return [...this.#records]; }
}
