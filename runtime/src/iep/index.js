// Intelligent Execution Platform — factory (EDR-006 / v1.7).
import { LockService } from './locks.js';
import { SessionService } from './sessions.js';
import { PriorityQueue } from './queue.js';
import { Scheduler } from './scheduler.js';
import { CacheService } from './cache.js';
import { MemoryService, MEMORY_LAYERS } from './memory.js';
import { CostEngine } from './cost.js';
import { MetricsService } from './metrics.js';
import { RuntimeRecorder } from './recorder.js';
import { Executor } from './executor.js';
import { Orchestrator } from './orchestrator.js';
import { AgentRuntime, AGENT_LIFECYCLE, normalizeAgentConfig } from './agent-runtime.js';
import { JOB_STATES } from './queue.js';

/**
 * Bootstrap a full IEP stack.
 * @param {{ bus?: { emit: Function }, costRates?: object }} [opts]
 */
export function createIEP(opts = {}) {
  const locks = new LockService();
  const sessions = new SessionService();
  const queue = new PriorityQueue();
  const scheduler = new Scheduler(queue);
  const cache = new CacheService();
  const memory = new MemoryService();
  const cost = new CostEngine({ rates: opts.costRates });
  const metrics = new MetricsService();
  const recorder = new RuntimeRecorder();
  const agents = new AgentRuntime({ memory, cost });

  const executor = new Executor({
    scheduler,
    queue,
    locks,
    cache,
    cost,
    metrics,
    recorder,
    memory,
    bus: opts.bus ?? null,
  });

  const orchestrator = new Orchestrator({ scheduler, queue, executor });

  scheduler.register('agent.run', agents.createJobHandler());
  scheduler.register('noop', async (job) => ({
    output: { ok: true, payload: job.payload },
    tokens: 0,
  }));
  scheduler.register('echo', async (job) => ({
    output: job.payload,
    tokens: Math.ceil(JSON.stringify(job.payload ?? {}).length / 4),
  }));

  return {
    locks,
    sessions,
    queue,
    scheduler,
    cache,
    memory,
    cost,
    metrics,
    recorder,
    executor,
    orchestrator,
    agents,
    kpis: (filter) => metrics.kpis(filter),
  };
}

export {
  LockService,
  SessionService,
  PriorityQueue,
  JOB_STATES,
  Scheduler,
  CacheService,
  MemoryService,
  MEMORY_LAYERS,
  CostEngine,
  MetricsService,
  RuntimeRecorder,
  Executor,
  Orchestrator,
  AgentRuntime,
  AGENT_LIFECYCLE,
  normalizeAgentConfig,
};
