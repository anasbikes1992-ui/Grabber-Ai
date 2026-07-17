// Priority job queue (in-memory; Redis streams later).
import { newId } from '../kernel/types.js';

export const JOB_STATES = Object.freeze([
  'queued', 'running', 'succeeded', 'failed', 'cancelled', 'dead',
]);

export class PriorityQueue {
  #jobs = new Map();
  #order = []; // ids sorted by (-priority, enqueuedAt)

  /**
   * @param {{
   *   type: string,
   *   projectId?: string,
   *   payload?: object,
   *   priority?: number,
   *   dependsOn?: string[],
   *   agentId?: string,
   *   maxAttempts?: number,
   * }} job
   */
  enqueue(job) {
    if (!job?.type) throw new Error('job.type required');
    const id = job.id ?? newId('job');
    const row = {
      id,
      type: job.type,
      projectId: job.projectId ?? null,
      payload: Object.freeze({ ...(job.payload ?? {}) }),
      priority: job.priority ?? 100,
      dependsOn: [...(job.dependsOn ?? [])],
      agentId: job.agentId ?? null,
      state: 'queued',
      attempts: 0,
      maxAttempts: job.maxAttempts ?? 3,
      result: null,
      error: null,
      enqueuedAt: Date.now(),
      startedAt: null,
      finishedAt: null,
    };
    this.#jobs.set(id, row);
    this.#order.push(id);
    this.#sort();
    return { ...row };
  }

  get(id) {
    const j = this.#jobs.get(id);
    return j ? { ...j, dependsOn: [...j.dependsOn] } : null;
  }

  /** Next runnable job whose dependencies succeeded. */
  dequeue() {
    for (const id of this.#order) {
      const j = this.#jobs.get(id);
      if (!j || j.state !== 'queued') continue;
      if (!this.#depsMet(j)) continue;
      j.state = 'running';
      j.attempts += 1;
      j.startedAt = Date.now();
      return { ...j, dependsOn: [...j.dependsOn] };
    }
    return null;
  }

  complete(id, result = null) {
    const j = this.#must(id);
    j.state = 'succeeded';
    j.result = result;
    j.finishedAt = Date.now();
    return this.get(id);
  }

  fail(id, error, { retry = true } = {}) {
    const j = this.#must(id);
    j.error = String(error?.message ?? error);
    if (retry && j.attempts < j.maxAttempts) {
      j.state = 'queued';
      j.startedAt = null;
      this.#sort();
      return this.get(id);
    }
    j.state = j.attempts >= j.maxAttempts ? 'dead' : 'failed';
    j.finishedAt = Date.now();
    return this.get(id);
  }

  cancel(id) {
    const j = this.#must(id);
    if (j.state === 'succeeded' || j.state === 'dead') return this.get(id);
    j.state = 'cancelled';
    j.finishedAt = Date.now();
    return this.get(id);
  }

  list({ state, projectId } = {}) {
    return [...this.#jobs.values()]
      .filter((j) => (!state || j.state === state) && (!projectId || j.projectId === projectId))
      .map((j) => this.get(j.id));
  }

  get depth() {
    return this.list({ state: 'queued' }).length;
  }

  #depsMet(job) {
    return job.dependsOn.every((dep) => {
      const d = this.#jobs.get(dep);
      return d && d.state === 'succeeded';
    });
  }

  #must(id) {
    const j = this.#jobs.get(id);
    if (!j) throw new Error(`unknown job ${id}`);
    return j;
  }

  #sort() {
    this.#order.sort((a, b) => {
      const ja = this.#jobs.get(a);
      const jb = this.#jobs.get(b);
      if (!ja || !jb) return 0;
      if (jb.priority !== ja.priority) return jb.priority - ja.priority;
      return ja.enqueuedAt - jb.enqueuedAt;
    });
  }
}
