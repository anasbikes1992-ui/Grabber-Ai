// services/capability-service.js — Capability Service (EDR-004 Foundation API).
// Capability Registry as a typed API (no undocumented capabilities).

export class CapabilityService {
  #store;
  #graph;

  constructor({ documents, graph = null }) {
    this.#store = documents;
    this.#graph = graph;
  }

  put(cap) {
    if (!cap?.name) throw new Error('capability.name required');
    const row = {
      name: cap.name,
      status: cap.status ?? 'Planned',
      owner: cap.owner ?? '',
      version: cap.version ?? '—',
      depends_on: cap.depends_on ?? [],
      validated_by: cap.validated_by ?? '',
      metrics: cap.metrics ?? [],
    };
    this.#store.put('capabilities', row.name, row);

    if (this.#graph) {
      const id = `capability:${row.name}`;
      this.#graph.upsertNode({ id, type: 'capability', props: { name: row.name, status: row.status } });
      for (const dep of row.depends_on) {
        const depId = `capability:${dep}`;
        this.#graph.upsertNode({ id: depId, type: 'capability', props: { name: dep } });
        this.#graph.addEdge({ from: id, to: depId, type: 'depends_on' });
      }
    }
    return row;
  }

  get(name) {
    return this.#store.get('capabilities', name);
  }

  query({ status, q } = {}) {
    return this.#store.query('capabilities', (c) => {
      if (status && !String(c.status).toLowerCase().includes(String(status).toLowerCase())) return false;
      if (q && !`${c.name} ${c.status} ${c.owner}`.toLowerCase().includes(String(q).toLowerCase())) return false;
      return true;
    });
  }

  /** Capabilities that list `name` as a dependency (reverse impact). */
  dependents(name) {
    return this.query({}).filter((c) => (c.depends_on ?? []).includes(name));
  }
}
