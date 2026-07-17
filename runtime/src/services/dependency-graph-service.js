// services/dependency-graph-service.js — Dependency Graph (docs/04 §7, §9.6).
// DG-01 ordering · DG-02 impact analysis · DG-03 provenance.

export class DependencyGraphService {
  #graph;
  #artifacts;
  #bus;
  #stale = new Map(); // projectId -> Set(artifactId)

  /**
   * @param {{
   *   graph: import('../storage/store.js').MemoryGraphStore,
   *   artifacts?: import('./artifact-query-service.js').ArtifactQueryService,
   *   bus?: import('../events/bus.js').EventBus,
   * }} deps
   */
  constructor({ graph, artifacts = null, bus = null }) {
    this.#graph = graph;
    this.#artifacts = artifacts;
    this.#bus = bus;

    if (bus) {
      bus.subscribe('project.dna_changed', 'dependency-graph', (event) => {
        this.onDnaChanged(event.project, event.payload ?? {});
      });
      bus.subscribe('artifact.produced', 'dependency-graph-index', (event) => {
        if (this.#artifacts) this.#artifacts.projectToGraph(event.project);
      });
    }
  }

  upsertNode(node) {
    return this.#graph.upsertNode(node);
  }

  addEdge(edge) {
    return this.#graph.addEdge(edge);
  }

  node(id) {
    return this.#graph.node(id);
  }

  /**
   * DG-01: topological sort of task-like nodes with depends_on edges.
   * @param {Array<{ id: string, dependsOn?: string[] }>} tasks
   */
  orderTasks(tasks) {
    const ids = new Set(tasks.map((t) => t.id));
    const deps = new Map(tasks.map((t) => [t.id, (t.dependsOn ?? []).filter((d) => ids.has(d))]));
    const indeg = new Map([...ids].map((id) => [id, 0]));
    for (const [, ds] of deps) for (const d of ds) indeg.set(d, indeg.get(d)); // ensure
    for (const [id, ds] of deps) indeg.set(id, ds.length);

    const ready = [...ids].filter((id) => indeg.get(id) === 0).sort();
    const ordered = [];
    const tempDeps = new Map([...deps].map(([k, v]) => [k, new Set(v)]));

    while (ready.length) {
      const id = ready.shift();
      ordered.push(id);
      for (const [other, ds] of tempDeps) {
        if (ds.has(id)) {
          ds.delete(id);
          if (ds.size === 0 && !ordered.includes(other) && !ready.includes(other)) {
            ready.push(other);
            ready.sort();
          }
        }
      }
    }
    if (ordered.length !== ids.size) {
      const cycle = [...ids].filter((id) => !ordered.includes(id));
      throw new Error(`dependency cycle among tasks: ${cycle.join(', ')} (DG-01)`);
    }
    return ordered;
  }

  /**
   * DG-02: impact analysis for a DNA change (or arbitrary seed nodes).
   * Marks affected artifacts stale for regeneration (AR-11, DC-08).
   */
  impact({ projectId, seeds, edgeTypes = null, markStale = true } = {}) {
    const seedList = seeds ?? (projectId ? [`dna:${projectId}`] : []);
    // Artifacts derive_from DNA sections — reverse direction for impact:
    // walk predecessors that point at DNA via derives_from, and dependents.
    const affected = [];
    const seen = new Set();

    // 1) Graph BFS from seeds following reverse derives_from and forward depends_on.
    for (const seed of seedList) {
      // Nodes that derive from this DNA node/section.
      for (const e of this.#graph.edges({ to: seed, type: 'derives_from' })) {
        collect(e.from, affected, seen);
        for (const down of this.#graph.impact(e.from, { edgeTypes: edgeTypes ?? ['depends_on', 'affected_by'], maxDepth: 32 })) {
          collect(down.id, affected, seen);
        }
      }
      // Also expand from seed itself.
      for (const down of this.#graph.impact(seed, { edgeTypes: edgeTypes ?? ['depends_on', 'affected_by', 'derives_from'], maxDepth: 8 })) {
        collect(down.id, affected, seen);
      }
    }

    // 2) Registry fallback: section-based query when graph is sparse.
    if (this.#artifacts && projectId) {
      for (const seed of seedList) {
        const section = String(seed).replace(/^dna:[^:]+:/, '').replace(/^dna:/, '');
        for (const a of this.#artifacts.byDnaSection(projectId, section)) {
          collect(`artifact:${a.id}`, affected, seen, a);
        }
        // If seed is whole DNA, every project artifact is potentially impacted.
        if (seed === `dna:${projectId}`) {
          for (const a of this.#artifacts.query({ project: projectId })) {
            collect(`artifact:${a.id}`, affected, seen, a);
          }
        }
      }
    }

    const artifactIds = affected
      .filter((n) => n.type === 'artifact' || String(n.id).startsWith('artifact:'))
      .map((n) => n.props?.id ?? String(n.id).replace(/^artifact:/, ''));

    if (markStale && projectId) {
      if (!this.#stale.has(projectId)) this.#stale.set(projectId, new Set());
      const set = this.#stale.get(projectId);
      for (const id of artifactIds) set.add(id);
    }

    return {
      seeds: seedList,
      affected_nodes: affected,
      stale_artifacts: artifactIds,
      count: affected.length,
    };
  }

  onDnaChanged(projectId, payload = {}) {
    if (this.#artifacts) this.#artifacts.projectToGraph(projectId);
    const sections = payload.sections?.map((s) => `dna:${projectId}:${s}`) ?? [`dna:${projectId}`];
    return this.impact({ projectId, seeds: sections, markStale: true });
  }

  staleArtifacts(projectId) {
    return [...(this.#stale.get(projectId) ?? [])];
  }

  clearStale(projectId, artifactId) {
    this.#stale.get(projectId)?.delete(artifactId);
  }

  /** DG-03: provenance walk for an artifact node. */
  provenance(artifactId) {
    if (this.#artifacts) return this.#artifacts.provenance(artifactId);
    const nodeId = artifactId.startsWith('artifact:') ? artifactId : `artifact:${artifactId}`;
    return this.#graph.impact(nodeId, { edgeTypes: ['depends_on', 'derives_from'], maxDepth: 16 });
  }

  /**
   * Platform search questions (CTO Priority 3).
   * @param {'dependents'|'rule-source'|'standards-for'|'blast-radius'|'capability-usage'} kind
   */
  answer(kind, params = {}) {
    switch (kind) {
      case 'dependents':
        return this.#artifacts ? this.#artifacts.dependents(params.artifactId) : [];
      case 'blast-radius':
        return this.impact({
          projectId: params.projectId,
          seeds: params.seeds,
          markStale: params.markStale ?? false,
        });
      case 'standards-for': {
        const node = params.componentId;
        return this.#graph.edges({ from: node, type: 'validates_against' });
      }
      case 'rule-source':
        // Decisions that point at rule via affected_by edge.
        return this.#graph.predecessors(`rule:${params.ruleId}`, 'affected_by');
      case 'capability-usage':
        return this.#graph.predecessors(`capability:${params.capability}`, 'depends_on');
      default:
        throw new Error(`unknown graph question "${kind}"`);
    }
  }
}

function collect(id, affected, seen, record = null) {
  if (seen.has(id)) return;
  seen.add(id);
  affected.push(record
    ? { id: `artifact:${record.id}`, type: 'artifact', props: { id: record.id, artifactType: record.type, state: record.state } }
    : { id, type: String(id).split(':')[0], props: {} });
}
