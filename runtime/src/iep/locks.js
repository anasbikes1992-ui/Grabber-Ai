// Distributed-style locks (in-memory reference; Redis adapter later).
import { newId } from '../kernel/types.js';

export class LockService {
  #locks = new Map(); // resource -> { token, owner, expiresAt }

  /**
   * @param {string} resource
   * @param {{ owner?: string, ttlMs?: number }} [opts]
   * @returns {{ ok: true, token: string } | { ok: false, holder: string }}
   */
  acquire(resource, { owner = 'system', ttlMs = 30_000 } = {}) {
    this.#purge();
    const cur = this.#locks.get(resource);
    if (cur && cur.expiresAt > Date.now()) {
      return { ok: false, holder: cur.owner };
    }
    const token = newId('lock');
    this.#locks.set(resource, {
      token,
      owner,
      expiresAt: Date.now() + ttlMs,
    });
    return { ok: true, token };
  }

  release(resource, token) {
    const cur = this.#locks.get(resource);
    if (!cur || cur.token !== token) return false;
    this.#locks.delete(resource);
    return true;
  }

  /** Extend hold if token matches. */
  renew(resource, token, ttlMs = 30_000) {
    const cur = this.#locks.get(resource);
    if (!cur || cur.token !== token) return false;
    cur.expiresAt = Date.now() + ttlMs;
    return true;
  }

  isHeld(resource) {
    this.#purge();
    return this.#locks.has(resource);
  }

  #purge() {
    const now = Date.now();
    for (const [k, v] of this.#locks) {
      if (v.expiresAt <= now) this.#locks.delete(k);
    }
  }
}
