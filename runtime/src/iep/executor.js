// Executor — runs a single job with lock, cost, cache, recorder, metrics.
export class Executor {
  #deps;

  /**
   * @param {{
   *   scheduler: import('./scheduler.js').Scheduler,
   *   queue: import('./queue.js').PriorityQueue,
   *   locks: import('./locks.js').LockService,
   *   cache: import('./cache.js').CacheService,
   *   cost: import('./cost.js').CostEngine,
   *   metrics: import('./metrics.js').MetricsService,
   *   recorder: import('./recorder.js').RuntimeRecorder,
   *   memory?: import('./memory.js').MemoryService,
   *   bus?: { emit: Function },
   * }} deps
   */
  constructor(deps) {
    this.#deps = deps;
  }

  /**
   * Execute one dequeued job (or a specific job id if already running).
   * @param {object} job
   * @param {{ ctx?: object }} [opts]
   */
  async run(job, opts = {}) {
    const {
      scheduler, queue, locks, cache, cost, metrics, recorder, memory, bus,
    } = this.#deps;

    const handler = scheduler.handler(job.type);
    if (!handler) {
      queue.fail(job.id, `no handler for job type "${job.type}"`, { retry: false });
      throw new Error(`no handler for job type "${job.type}"`);
    }

    const resource = `job:${job.projectId ?? 'platform'}:${job.type}`;
    const lock = locks.acquire(resource, { owner: job.id, ttlMs: 60_000 });
    if (!lock.ok) {
      queue.fail(job.id, `lock held by ${lock.holder}`, { retry: true });
      return { ok: false, reason: 'locked', job: queue.get(job.id) };
    }

    const estimate = cost.estimate({
      model: job.payload?.model ?? 'stub',
      estimatedTokens: job.payload?.estimatedTokens ?? 500,
    });

    const executionId = recorder.start({
      projectId: job.projectId,
      jobId: job.id,
      agentId: job.agentId,
      type: job.type,
      context: {
        payload: job.payload,
        estimate,
        memory: memory?.snapshot({ projectId: job.projectId, actor: job.payload?.actor }) ?? null,
      },
    });

    const started = Date.now();
    let cacheHits = 0;
    let cacheMisses = 0;
    const cacheBefore = cache.stats();

    try {
      recorder.event(executionId, { type: 'job.started', jobId: job.id });
      bus?.emit?.({
        type: 'task.dispatched',
        project: job.projectId ?? 'platform',
        stage: job.payload?.stage ?? '',
        subject: job.id,
        actor: 'iep-executor',
        payload: { type: job.type, agentId: job.agentId },
      });

      const result = await handler(job, {
        ...opts.ctx,
        executionId,
        cache,
        memory,
        recorder,
        estimate,
      });

      const after = cache.stats();
      cacheHits = after.hits - cacheBefore.hits;
      cacheMisses = after.misses - cacheBefore.misses;

      const durationMs = Date.now() - started;
      const actualTokens = result?.tokens ?? job.payload?.estimatedTokens ?? estimate.estimated_tokens;
      const costRow = cost.record({
        executionId,
        projectId: job.projectId,
        model: job.payload?.model ?? 'stub',
        estimatedTokens: estimate.estimated_tokens,
        actualTokens,
        durationMs,
        modelsUsed: result?.modelsUsed ?? [job.payload?.model ?? 'stub'],
      });
      recorder.cost(executionId, costRow);
      if (result?.artifactId) recorder.artifact(executionId, result.artifactId);
      if (result?.output) recorder.output(executionId, result.output);
      if (result?.validation) recorder.validation(executionId, result.validation);

      queue.complete(job.id, result);
      recorder.finish(executionId, { status: 'succeeded' });

      metrics.record({
        kind: 'execution',
        projectId: job.projectId,
        executionId,
        jobId: job.id,
        latencyMs: durationMs,
        cost: costRow.actual_cost,
        failed: false,
        cacheHitRate: (cacheHits + cacheMisses) ? cacheHits / (cacheHits + cacheMisses) : 0,
        tokens: actualTokens,
        artifact_ok: result?.artifactId ? 1 : 0,
        artifact_total: result?.artifactId ? 1 : 0,
      });

      bus?.emit?.({
        type: 'task.completed',
        project: job.projectId ?? 'platform',
        stage: job.payload?.stage ?? '',
        subject: job.id,
        actor: 'iep-executor',
        payload: { executionId, durationMs },
      });

      return {
        ok: true,
        executionId,
        result,
        cost: costRow,
        replay: recorder.replay(executionId),
        cache: { hits: cacheHits, misses: cacheMisses },
      };
    } catch (err) {
      const durationMs = Date.now() - started;
      recorder.failure(executionId, err);
      const failedJob = queue.fail(job.id, err, { retry: true });
      if (failedJob.attempts > 1 && failedJob.state === 'queued') {
        metrics.record({ kind: 'retry', projectId: job.projectId, jobId: job.id });
      }
      recorder.finish(executionId, { status: 'failed' });
      metrics.record({
        kind: 'execution',
        projectId: job.projectId,
        executionId,
        jobId: job.id,
        latencyMs: durationMs,
        cost: 0,
        failed: true,
      });
      bus?.emit?.({
        type: 'task.failed',
        project: job.projectId ?? 'platform',
        stage: job.payload?.stage ?? '',
        subject: job.id,
        actor: 'iep-executor',
        payload: { error: String(err.message ?? err) },
      });
      return {
        ok: false,
        executionId,
        error: String(err.message ?? err),
        job: failedJob,
        replay: recorder.replay(executionId),
      };
    } finally {
      locks.release(resource, lock.token);
    }
  }
}
