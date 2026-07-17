// Memory as a Service — layered stores (EDR-006).
import { newId } from '../kernel/types.js';

export const MEMORY_LAYERS = Object.freeze([
  'working',
  'project',
  'knowledge',
  'organization',
  'personal',
]);

export class MemoryService {
  #layers = new Map();

  constructor() {
    for (const layer of MEMORY_LAYERS) this.#layers.set(layer, new Map());
  }

  /**
   * @param {'working'|'project'|'knowledge'|'organization'|'personal'} layer
   * @param {{ key: string, value: unknown, scope?: string, meta?: object }} entry
   */
  put(layer, { key, value, scope = 'default', meta = {} }) {
    this.#assertLayer(layer);
    if (!key) throw new Error('memory key required');
    const id = `${scope}::${key}`;
    const row = Object.freeze({
      id: newId('mem'),
      layer,
      key,
      scope,
      value,
      meta: Object.freeze({ ...meta }),
      updatedAt: new Date().toISOString(),
    });
    this.#layers.get(layer).set(id, row);
    return row;
  }

  get(layer, key, scope = 'default') {
    this.#assertLayer(layer);
    return this.#layers.get(layer).get(`${scope}::${key}`) ?? null;
  }

  query(layer, { scope, prefix } = {}) {
    this.#assertLayer(layer);
    return [...this.#layers.get(layer).values()].filter((r) => {
      if (scope && r.scope !== scope) return false;
      if (prefix && !r.key.startsWith(prefix)) return false;
      return true;
    });
  }

  delete(layer, key, scope = 'default') {
    this.#assertLayer(layer);
    return this.#layers.get(layer).delete(`${scope}::${key}`);
  }

  /** Snapshot for recorder / context assembly. */
  snapshot({ projectId, actor } = {}) {
    return {
      working: this.query('working', { scope: projectId ?? 'default' }),
      project: projectId ? this.query('project', { scope: projectId }) : [],
      knowledge: this.query('knowledge', {}),
      organization: this.query('organization', {}),
      personal: actor ? this.query('personal', { scope: actor }) : [],
    };
  }

  #assertLayer(layer) {
    if (!this.#layers.has(layer)) {
      throw new Error(`unknown memory layer "${layer}" — use ${MEMORY_LAYERS.join('|')}`);
    }
  }
}
