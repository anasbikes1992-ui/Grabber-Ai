// services/decision-service.js — Decision Service (EDR-004 Foundation API).
// EDRs are first-class queryable records (Article V / Decision Registry).

export class DecisionService {
  #store;
  #graph;
  #vectors;

  constructor({ documents, graph = null, vectors = null }) {
    this.#store = documents;
    this.#graph = graph;
    this.#vectors = vectors;
  }

  put(edr) {
    if (!edr?.id) throw new Error('decision.id required (EDR-NNN)');
    const row = {
      id: edr.id,
      status: edr.status ?? 'Proposed',
      owner: edr.owner ?? '',
      project: edr.project ?? 'platform',
      stage: edr.stage ?? '',
      title: edr.title ?? edr.id,
      body: edr.body ?? '',
      related_standards: edr.related_standards ?? [],
      related_components: edr.related_components ?? [],
      introduced_rules: edr.introduced_rules ?? [],
      created_at: edr.created_at ?? new Date().toISOString(),
    };
    this.#store.put('decisions', row.id, row);

    if (this.#graph) {
      this.#graph.upsertNode({ id: `edr:${row.id}`, type: 'decision', props: { id: row.id, status: row.status } });
      for (const rule of row.introduced_rules) {
        this.#graph.upsertNode({ id: `rule:${rule}`, type: 'rule', props: { id: rule } });
        this.#graph.addEdge({ from: `edr:${row.id}`, to: `rule:${rule}`, type: 'affected_by' });
      }
      for (const std of row.related_standards) {
        this.#graph.upsertNode({ id: `standard:${std}`, type: 'standard', props: { id: std } });
        this.#graph.addEdge({ from: `edr:${row.id}`, to: `standard:${std}`, type: 'validates_against' });
      }
    }
    if (this.#vectors) {
      this.#vectors.upsert({
        id: `edr:${row.id}`,
        text: `${row.title}\n${row.body}\n${row.introduced_rules.join(' ')}`,
        meta: { collection: 'decisions', id: row.id, status: row.status, project: row.project },
      });
    }
    return row;
  }

  get(id) {
    return this.#store.get('decisions', id);
  }

  query({ status, project, rule, q } = {}) {
    return this.#store.query('decisions', (d) => {
      if (status && d.status !== status) return false;
      if (project && d.project !== project) return false;
      if (rule && !(d.introduced_rules ?? []).includes(rule) && !(d.related_standards ?? []).includes(rule)) return false;
      if (q) {
        const hay = `${d.id} ${d.title} ${d.body}`.toLowerCase();
        if (!hay.includes(String(q).toLowerCase())) return false;
      }
      return true;
    });
  }

  /** Which EDR introduced a rule? (CTO search question) */
  introducedRule(ruleId) {
    return this.query({}).filter((d) => (d.introduced_rules ?? []).includes(ruleId));
  }
}
