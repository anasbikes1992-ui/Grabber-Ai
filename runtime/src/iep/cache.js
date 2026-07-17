// Execution cache (context hashes, tool results).
export class CacheService {
  #store = new Map();
  #hits = 0;
  #misses = 0;

  get(key) {
    if (!this.#store.has(key)) {
      this.#misses += 1;
      return undefined;
    }
    const row = this.#store.get(key);
    if (row.expiresAt && row.expiresAt <= Date.now()) {
      this.#store.delete(key);
      this.#misses += 1;
      return undefined;
    }
    this.#hits += 1;
    return row.value;
  }

  set(key, value, ttlMs = null) {
    this.#store.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    });
  }

  delete(key) {
    return this.#store.delete(key);
  }

  stats() {
    return {
      size: this.#store.size,
      hits: this.#hits,
      misses: this.#misses,
      hitRate: (this.#hits + this.#misses) ? this.#hits / (this.#hits + this.#misses) : 0,
    };
  }

  resetStats() {
    this.#hits = 0;
    this.#misses = 0;
  }
}
