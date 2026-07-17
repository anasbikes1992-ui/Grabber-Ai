// services/artifact-query-service.js — Artifact Query Service (EDR-004).
// Read model over the Artifact Registry. Registry remains the only write path.

export class ArtifactQueryService {
  #registry;
  #graph;

  /**
   * @param {{ registry: { get: Function, query: Function }, graph?: import('../storage/store.js').MemoryGraphStore }} deps
   */
  constructor({ registry, graph = null }) {
    this.#registry = registry;
    this.#graph = graph;
  }

  get(id) {
    return this.#registry.get(id);
  }

  /**
   * Rich query — answers platform questions, not "find files".
   * @param {{
   *   project?: string,
   *   type?: string,
   *   state?: string,
   *   stage?: string,
   *   derivesFrom?: string,
   *   relatedStandard?: string,
   *   producer?: string,
   *   inputOf?: string,
   *   dependsOnArtifact?: string,
   * }} filter
   */
  query(filter = {}) {
    let rows = this.#registry.query({
      project: filter.project,
      type: filter.type,
      state: filter.state,
    });
    if (filter.stage) rows = rows.filter((a) => a.stage === filter.stage);
    if (filter.producer) rows = rows.filter((a) => a.producer?.agent === filter.producer);
    if (filter.derivesFrom) {
      rows = rows.filter((a) => (a.derives_from ?? []).some((d) =>
        d === filter.derivesFrom || String(d).includes(filter.derivesFrom)));
    }
    if (filter.relatedStandard) {
      rows = rows.filter((a) => (a.related_standards ?? []).includes(filter.relatedStandard));
    }
    if (filter.dependsOnArtifact) {
      rows = rows.filter((a) => (a.inputs ?? []).includes(filter.dependsOnArtifact));
    }
    if (filter.inputOf) {
      const parent = this.#registry.get(filter.inputOf);
      const inputs = new Set(parent.inputs ?? []);
      rows = rows.filter((a) => inputs.has(a.id));
    }
    return rows;
  }

  /** Which artifacts depend on this API / contract / artifact id? */
  dependents(artifactId) {
    return this.#registry.query({}).filter((a) => (a.inputs ?? []).includes(artifactId));
  }

  /** Ancestry via inputs (and optional graph). */
  provenance(artifactId, { maxDepth = 16 } = {}) {
    const chain = [];
    const seen = new Set();
    const walk = (id, depth) => {
      if (depth > maxDepth || seen.has(id)) return;
      seen.add(id);
      let art;
      try { art = this.#registry.get(id); } catch { return; }
      chain.push({ id: art.id, type: art.type, state: art.state, derives_from: art.derives_from });
      for (const input of art.inputs ?? []) walk(input, depth + 1);
    };
    walk(artifactId, 0);
    return chain;
  }

  /** Artifacts deriving from a DNA section path (for impact after dna_changed). */
  byDnaSection(projectId, section) {
    const needle = section.startsWith('dna:') ? section : `dna:${section}`;
    return this.query({ project: projectId }).filter((a) =>
      (a.derives_from ?? []).some((d) => d === needle || d === section || String(d).endsWith(`:${section}`) || String(d).includes(section)));
  }

  /** Index registry artifacts into the dependency graph (projection). */
  projectToGraph(projectId) {
    if (!this.#graph) return 0;
    const arts = this.query({ project: projectId });
    let n = 0;
    for (const a of arts) {
      this.#graph.upsertNode({
        id: `artifact:${a.id}`,
        type: 'artifact',
        props: { id: a.id, artifactType: a.type, state: a.state, project: a.project },
      });
      n++;
      for (const d of a.derives_from ?? []) {
        const dnaNode = d.startsWith('dna:') ? d : `dna:${a.project}:${d.replace(/^dna:/, '')}`;
        // Ensure a soft DNA section node exists for linking.
        const sectionKey = d.includes(':') ? d : `dna:${a.project}:${d}`;
        this.#graph.upsertNode({ id: sectionKey, type: 'dna_section', props: { ref: d, projectId: a.project } });
        this.#graph.addEdge({ from: `artifact:${a.id}`, to: sectionKey, type: 'derives_from' });
        void dnaNode;
      }
      for (const input of a.inputs ?? []) {
        this.#graph.upsertNode({ id: `artifact:${input}`, type: 'artifact', props: { id: input } });
        this.#graph.addEdge({ from: `artifact:${a.id}`, to: `artifact:${input}`, type: 'depends_on' });
      }
      for (const std of a.related_standards ?? []) {
        this.#graph.upsertNode({ id: `rule:${std}`, type: 'rule', props: { id: std } });
        this.#graph.addEdge({ from: `artifact:${a.id}`, to: `rule:${std}`, type: 'validates_against' });
      }
    }
    return n;
  }
}
