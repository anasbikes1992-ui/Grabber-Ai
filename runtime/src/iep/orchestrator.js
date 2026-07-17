// Orchestrator — drains queue via dependency-aware scheduling until idle or limit.
export class Orchestrator {
  #scheduler;
  #queue;
  #executor;

  constructor({ scheduler, queue, executor }) {
    this.#scheduler = scheduler;
    this.#queue = queue;
    this.#executor = executor;
  }

  /**
   * Run until queue has no runnable jobs or maxSteps reached.
   * @param {{ maxSteps?: number, ctx?: object }} [opts]
   */
  async runUntilIdle({ maxSteps = 100, ctx = {} } = {}) {
    const results = [];
    for (let i = 0; i < maxSteps; i++) {
      const job = this.#queue.dequeue();
      if (!job) break;
      const out = await this.#executor.run(job, { ctx });
      results.push(out);
    }
    return {
      steps: results.length,
      results,
      pending: this.#queue.depth,
      dead: this.#queue.list({ state: 'dead' }),
      failed: this.#queue.list({ state: 'failed' }),
    };
  }

  /**
   * Schedule a dependency DAG then run.
   * @param {Array<{ id?: string, type: string, dependsOn?: string[], priority?: number, projectId?: string, payload?: object, agentId?: string }>} jobs
   */
  async runDag(jobs, opts = {}) {
    // Preserve declared ids for dependsOn references
    const scheduled = [];
    for (const j of jobs) {
      scheduled.push(this.#queue.enqueue(j));
    }
    const run = await this.runUntilIdle(opts);
    return { scheduled, ...run };
  }

  get scheduler() {
    return this.#scheduler;
  }

  get queue() {
    return this.#queue;
  }
}
