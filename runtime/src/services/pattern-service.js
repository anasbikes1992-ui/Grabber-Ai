// services/pattern-service.js — Pattern Service (EDR-004 Foundation API).

export class PatternService {
  #store;
  #graph;
  #vectors;

  constructor({ documents, graph = null, vectors = null }) {
    this.#store = documents;
    this.#graph = graph;
    this.#vectors = vectors;
  }

  put(pattern) {
    if (!pattern?.id) throw new Error('pattern.id required (pattern/<domain>/<slug>)');
    const row = {
      id: pattern.id,
      industry: pattern.industry ?? [],
      status: pattern.status ?? 'proposed',
      version: pattern.version ?? '0.1.0',
      problem: pattern.problem ?? '',
      solution: pattern.solution ?? '',
      standards: pattern.standards ?? [],
      source_project: pattern.source_project ?? '',
      last_validated: pattern.last_validated ?? null,
      capabilities: pattern.capabilities ?? [],
    };
    this.#store.put('patterns', row.id, row);

    if (this.#graph) {
      this.#graph.upsertNode({ id: `pattern:${row.id}`, type: 'pattern', props: { id: row.id, status: row.status } });
      for (const cap of row.capabilities) {
        this.#graph.upsertNode({ id: `capability:${cap}`, type: 'capability', props: { name: cap } });
        this.#graph.addEdge({ from: `pattern:${row.id}`, to: `capability:${cap}`, type: 'depends_on' });
      }
      for (const std of row.standards) {
        this.#graph.upsertNode({ id: `rule:${std}`, type: 'rule', props: { id: std } });
        this.#graph.addEdge({ from: `pattern:${row.id}`, to: `rule:${std}`, type: 'validates_against' });
      }
    }
    if (this.#vectors) {
      this.#vectors.upsert({
        id: `pattern:${row.id}`,
        text: `${row.id}\n${row.problem}\n${row.solution}`,
        meta: { collection: 'patterns', id: row.id, status: row.status, industry: row.industry },
      });
    }
    return row;
  }

  get(id) {
    return this.#store.get('patterns', id);
  }

  query({ industry, status, capability, q } = {}) {
    return this.#store.query('patterns', (p) => {
      if (status && p.status !== status) return false;
      if (industry) {
        const inds = Array.isArray(p.industry) ? p.industry : [p.industry];
        if (!inds.includes(industry) && !inds.includes('any')) return false;
      }
      if (capability && !(p.capabilities ?? []).includes(capability)) return false;
      if (q) {
        const hay = `${p.id} ${p.problem} ${p.solution}`.toLowerCase();
        if (!hay.includes(String(q).toLowerCase())) return false;
      }
      return true;
    });
  }

  /** Patterns that use a capability (CTO search: which templates use this capability?) */
  usingCapability(capability) {
    return this.query({ capability });
  }
}
