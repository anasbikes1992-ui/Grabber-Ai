// Execution / operator sessions.
import { newId } from '../kernel/types.js';

export class SessionService {
  #sessions = new Map();

  create({ projectId = null, actor = 'system', meta = {}, ttlMs = 3_600_000 } = {}) {
    const id = newId('sess');
    const row = {
      id,
      projectId,
      actor,
      meta: Object.freeze({ ...meta }),
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + ttlMs,
      closed: false,
    };
    this.#sessions.set(id, row);
    return { ...row };
  }

  get(id) {
    const s = this.#sessions.get(id);
    if (!s || s.closed || s.expiresAt <= Date.now()) return null;
    return { ...s };
  }

  touch(id, ttlMs = 3_600_000) {
    const s = this.#sessions.get(id);
    if (!s || s.closed) return false;
    s.expiresAt = Date.now() + ttlMs;
    return true;
  }

  close(id) {
    const s = this.#sessions.get(id);
    if (!s) return false;
    s.closed = true;
    return true;
  }

  list({ projectId } = {}) {
    return [...this.#sessions.values()]
      .filter((s) => !s.closed && s.expiresAt > Date.now())
      .filter((s) => !projectId || s.projectId === projectId)
      .map((s) => ({ ...s }));
  }
}
