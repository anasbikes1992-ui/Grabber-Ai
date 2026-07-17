// storage/store.js — pluggable storage contracts (EDR-004).
// Business logic depends only on these interfaces. Default: in-memory.
// Future adapters: PostgreSQL (relational), Redis (queues/locks/sessions),
// vector providers (embeddings) — swap without changing service code.

import { newId } from '../kernel/types.js';

/** Minimal document store: collection → id → record. */
export class MemoryDocumentStore {
  #collections = new Map();

  collection(name) {
    if (!this.#collections.has(name)) this.#collections.set(name, new Map());
    return this.#collections.get(name);
  }

  put(collection, id, record) {
    const col = this.collection(collection);
    const row = Object.freeze({ ...record, id });
    col.set(id, row);
    return row;
  }

  get(collection, id) {
    return this.collection(collection).get(id) ?? null;
  }

  delete(collection, id) {
    return this.collection(collection).delete(id);
  }

  query(collection, predicate = () => true) {
    return [...this.collection(collection).values()].filter(predicate);
  }

  upsert(collection, id, record) {
    return this.put(collection, id, record);
  }
}

/** Directed multi-graph for Dependency Graph (docs/04 §7). */
export class MemoryGraphStore {
  #nodes = new Map(); // id -> { id, type, props }
  #edges = []; // { id, from, to, type, props }

  upsertNode({ id, type, props = {} }) {
    if (!id) throw new Error('graph node id required');
    if (!type) throw new Error('graph node type required');
    const node = Object.freeze({ id, type, props: Object.freeze({ ...props }) });
    this.#nodes.set(id, node);
    return node;
  }

  addEdge({ from, to, type, props = {} }) {
    if (!this.#nodes.has(from)) throw new Error(`unknown graph node ${from}`);
    if (!this.#nodes.has(to)) throw new Error(`unknown graph node ${to}`);
    if (!type) throw new Error('graph edge type required');
    const edge = Object.freeze({
      id: newId('edge'),
      from,
      to,
      type,
      props: Object.freeze({ ...props }),
    });
    this.#edges.push(edge);
    return edge;
  }

  node(id) {
    return this.#nodes.get(id) ?? null;
  }

  nodes({ type } = {}) {
    return [...this.#nodes.values()].filter((n) => !type || n.type === type);
  }

  edges({ from, to, type } = {}) {
    return this.#edges.filter((e) =>
      (!from || e.from === from) &&
      (!to || e.to === to) &&
      (!type || e.type === type));
  }

  /** Outgoing neighbors (optionally filtered by edge type). */
  successors(id, edgeType) {
    return this.edges({ from: id, type: edgeType }).map((e) => this.#nodes.get(e.to)).filter(Boolean);
  }

  /** Incoming neighbors. */
  predecessors(id, edgeType) {
    return this.edges({ to: id, type: edgeType }).map((e) => this.#nodes.get(e.from)).filter(Boolean);
  }

  /** BFS impact set following edge types forward from seeds. */
  impact(seeds, { edgeTypes = null, maxDepth = 32 } = {}) {
    const start = Array.isArray(seeds) ? seeds : [seeds];
    const seen = new Set();
    const queue = start.map((id) => ({ id, depth: 0 }));
    const hit = [];
    while (queue.length) {
      const { id, depth } = queue.shift();
      if (seen.has(id) || depth > maxDepth) continue;
      seen.add(id);
      if (depth > 0) {
        const n = this.#nodes.get(id);
        if (n) hit.push(n);
      }
      for (const e of this.edges({ from: id })) {
        if (edgeTypes && !edgeTypes.includes(e.type)) continue;
        if (!seen.has(e.to)) queue.push({ id: e.to, depth: depth + 1 });
      }
    }
    return hit;
  }

  clear() {
    this.#nodes.clear();
    this.#edges.length = 0;
  }
}

/**
 * Vector index with swappable provider (EDR-004).
 * Default: bag-of-words cosine over term frequencies — good enough for tests
 * and offline semantic-ish search without a model vendor.
 */
export class MemoryVectorIndex {
  #docs = new Map(); // id -> { id, text, meta, vector }

  upsert({ id, text, meta = {} }) {
    if (!id) throw new Error('vector doc id required');
    const vector = embed(text ?? '');
    const row = Object.freeze({ id, text: text ?? '', meta: Object.freeze({ ...meta }), vector });
    this.#docs.set(id, row);
    return row;
  }

  delete(id) {
    return this.#docs.delete(id);
  }

  search(query, { limit = 10, filter = () => true } = {}) {
    const q = embed(query ?? '');
    return [...this.#docs.values()]
      .filter((d) => filter(d.meta))
      .map((d) => ({ id: d.id, score: cosine(q, d.vector), meta: d.meta, text: d.text }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  get size() {
    return this.#docs.size;
  }
}

function embed(text) {
  const terms = String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const tf = new Map();
  for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [, v] of b) nb += v * v;
  if (!na || !nb) return 0;
  for (const [k, v] of a) {
    if (b.has(k)) dot += v * b.get(k);
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Bundle of default providers used by PlatformServices. */
export function createDefaultStorage() {
  return {
    documents: new MemoryDocumentStore(),
    graph: new MemoryGraphStore(),
    vectors: new MemoryVectorIndex(),
  };
}
