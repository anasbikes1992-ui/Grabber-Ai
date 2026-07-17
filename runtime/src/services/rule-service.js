// services/rule-service.js — Rule Service (EDR-004 Foundation API).
// Standards are binding knowledge. Agents query rules by id/prefix/standard
// instead of free-reading markdown (Rule 4).

const SEED_RULES = [
  { id: 'AR-01', standard: '01-ARCHITECTURE', prefix: 'AR', level: 'MUST', statement: 'Choose architecture style explicitly and record it in DNA.', version: '1.0.0' },
  { id: 'AR-11', standard: '01-ARCHITECTURE', prefix: 'AR', level: 'MUST', statement: 'DNA changes regenerate derived artifacts; no hand-patch drift.', version: '1.0.0' },
  { id: 'DC-05', standard: '13-DOCUMENTATION', prefix: 'DC', level: 'MUST', statement: 'Artifacts declare related standards.', version: '1.0.0' },
  { id: 'DC-07', standard: '13-DOCUMENTATION', prefix: 'DC', level: 'MUST', statement: 'Docs update in the same change as code.', version: '1.0.0' },
  { id: 'DC-08', standard: '13-DOCUMENTATION', prefix: 'DC', level: 'MUST', statement: 'Regenerate docs when DNA sections change.', version: '1.0.0' },
  { id: 'AP-05', standard: '04-API', prefix: 'AP', level: 'MUST', statement: 'API responses use a consistent envelope.', version: '1.0.0' },
  { id: 'DB-03', standard: '03-DATABASE', prefix: 'DB', level: 'MUST', statement: 'Naming convention is singular or plural and project-wide.', version: '1.0.0' },
  { id: 'S-11', standard: '05-SECURITY', prefix: 'S', level: 'MUST', statement: 'Security controls map to threat model and standards.', version: '1.0.0' },
  { id: 'TS-03', standard: '12-TESTING', prefix: 'TS', level: 'MUST', statement: 'Acceptance criteria map to tests.', version: '1.0.0' },
  { id: 'TS-09', standard: '12-TESTING', prefix: 'TS', level: 'MUST', statement: 'Tests required on every merge.', version: '1.0.0' },
  { id: 'OB-09', standard: '15-OBSERVABILITY', prefix: 'OB', level: 'MUST', statement: 'Pipeline stages emit structured telemetry.', version: '1.0.0' },
  { id: 'OB-10', standard: '15-OBSERVABILITY', prefix: 'OB', level: 'MUST', statement: 'Producer metadata includes prompt and standards versions.', version: '1.0.0' },
  { id: 'PR-04', standard: '18-PROMPT', prefix: 'PR', level: 'MUST', statement: 'Constraint blocks use must/should/may/must_not/assumptions/unknowns/risks.', version: '1.0.0' },
  { id: 'DO-09', standard: '14-DEVOPS', prefix: 'DO', level: 'MUST', statement: 'Deployment gate is absolute (100%).', version: '1.0.0' },
  { id: 'POL-001', standard: '05-SECURITY', prefix: 'POL', level: 'MUST', statement: 'Block deployment when security score < 95.', version: '1.0.0' },
];

export class RuleService {
  #store;
  #graph;

  constructor({ documents, graph = null, seed = true }) {
    this.#store = documents;
    this.#graph = graph;
    if (seed) this.seed(SEED_RULES);
  }

  seed(rules) {
    for (const r of rules) this.put(r);
  }

  put(rule) {
    if (!rule?.id) throw new Error('rule.id required');
    const row = {
      id: rule.id,
      standard: rule.standard ?? '',
      prefix: rule.prefix ?? rule.id.split('-')[0],
      level: rule.level ?? 'MUST',
      statement: rule.statement ?? '',
      version: rule.version ?? '1.0.0',
    };
    this.#store.put('rules', row.id, row);
    if (this.#graph) {
      this.#graph.upsertNode({ id: `rule:${row.id}`, type: 'rule', props: { id: row.id, standard: row.standard } });
      if (row.standard) {
        const sid = `standard:${row.standard}`;
        this.#graph.upsertNode({ id: sid, type: 'standard', props: { id: row.standard } });
        this.#graph.addEdge({ from: `rule:${row.id}`, to: sid, type: 'validates_against' });
      }
    }
    return row;
  }

  get(id) {
    return this.#store.get('rules', id);
  }

  /** Query by id list, prefix, standard, or free text over statement. */
  query({ ids, prefix, standard, q } = {}) {
    return this.#store.query('rules', (r) => {
      if (ids?.length && !ids.includes(r.id)) return false;
      if (prefix && r.prefix !== prefix && !r.id.startsWith(prefix)) return false;
      if (standard && r.standard !== standard) return false;
      if (q) {
        const hay = `${r.id} ${r.statement} ${r.standard}`.toLowerCase();
        if (!hay.includes(String(q).toLowerCase())) return false;
      }
      return true;
    });
  }

  /** Which standards bind a component / task (by rule id list). */
  applicable(ruleIds = []) {
    return this.query({ ids: ruleIds });
  }
}
