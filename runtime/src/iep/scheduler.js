// Scheduler — accepts work definitions, enqueues with priority + deps.
export class Scheduler {
  #queue;
  #handlers = new Map(); // type -> async (job, ctx) => result

  constructor(queue) {
    this.#queue = queue;
  }

  register(type, handler) {
    if (!type || typeof handler !== 'function') throw new Error('register(type, handler) required');
    this.#handlers.set(type, handler);
  }

  hasHandler(type) {
    return this.#handlers.has(type);
  }

  handler(type) {
    return this.#handlers.get(type) ?? null;
  }

  /**
   * Schedule a job (or DAG of jobs).
   * @param {object|object[]} jobs
   */
  schedule(jobs) {
    const list = Array.isArray(jobs) ? jobs : [jobs];
    return list.map((j) => this.#queue.enqueue(j));
  }

  /** Schedule agent role as a job (agents are jobs, not special cases). */
  scheduleAgent({ agentId, projectId, payload = {}, priority = 100, dependsOn = [] }) {
    return this.#queue.enqueue({
      type: 'agent.run',
      agentId,
      projectId,
      payload,
      priority,
      dependsOn,
    });
  }

  get queue() {
    return this.#queue;
  }
}
