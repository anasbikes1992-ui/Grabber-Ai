// Intelligent Execution Platform acceptance tests (EDR-006 / v1.7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIEP, AGENT_LIFECYCLE, MEMORY_LAYERS } from '../src/iep/index.js';
import { defineAgent, AGENT_STEPS } from '../../packages/agent-sdk/src/index.js';
import { EventBus } from '../src/events/bus.js';

test('IEP queue respects priority and dependency order', async () => {
  const iep = createIEP();
  const order = [];
  iep.scheduler.register('track', async (job) => {
    order.push(job.payload.name);
    return { output: job.payload.name, tokens: 10 };
  });

  const a = iep.queue.enqueue({ type: 'track', payload: { name: 'a' }, priority: 10 });
  const b = iep.queue.enqueue({ type: 'track', payload: { name: 'b' }, priority: 50, dependsOn: [a.id] });
  const c = iep.queue.enqueue({ type: 'track', payload: { name: 'c' }, priority: 100, dependsOn: [b.id] });

  // c has highest priority but depends on b→a — must run a,b,c
  const run = await iep.orchestrator.runUntilIdle();
  assert.equal(run.steps, 3);
  assert.deepEqual(order, ['a', 'b', 'c']);
  assert.equal(iep.queue.get(c.id).state, 'succeeded');
});

test('executor records cost, metrics, and replayable execution', async () => {
  const bus = new EventBus();
  const iep = createIEP({ bus });
  iep.scheduler.schedule({
    type: 'echo',
    projectId: 'proj-cost',
    payload: { hello: 'world', model: 'gpt-class', estimatedTokens: 1000 },
  });
  // fix model on payload for cost engine
  const job = iep.queue.list({ state: 'queued' })[0];
  // re-enqueue properly
  iep.queue.cancel(job.id);
  iep.scheduler.schedule({
    type: 'echo',
    projectId: 'proj-cost',
    payload: { hello: 'world', model: 'gpt-class', estimatedTokens: 1000 },
  });

  const run = await iep.orchestrator.runUntilIdle();
  assert.equal(run.results[0].ok, true);
  const executionId = run.results[0].executionId;
  const replay = iep.recorder.replay(executionId);
  assert.equal(replay.status, 'succeeded');
  assert.ok(replay.duration >= 0);
  assert.ok(replay.cost);
  assert.ok(replay.cost.actual_cost >= 0);
  assert.ok(replay.events.length >= 1);

  const kpis = iep.kpis({ projectId: 'proj-cost' });
  assert.equal(kpis.executions, 1);
  assert.equal(kpis.runtime_reliability, 1);
  assert.ok(kpis.total_cost >= 0);
});

test('locks prevent concurrent same-resource execution contention path', () => {
  const iep = createIEP();
  const a = iep.locks.acquire('resource-x', { owner: 'a' });
  assert.equal(a.ok, true);
  const b = iep.locks.acquire('resource-x', { owner: 'b' });
  assert.equal(b.ok, false);
  assert.equal(iep.locks.release('resource-x', a.token), true);
  const c = iep.locks.acquire('resource-x', { owner: 'c' });
  assert.equal(c.ok, true);
});

test('memory layers are separate stores', () => {
  const iep = createIEP();
  assert.ok(MEMORY_LAYERS.includes('working'));
  iep.memory.put('working', { key: 'draft', scope: 'p1', value: { x: 1 } });
  iep.memory.put('project', { key: 'decision', scope: 'p1', value: { edr: 'EDR-006' } });
  iep.memory.put('knowledge', { key: 'pattern', value: { id: 'task-manager' } });
  iep.memory.put('organization', { key: 'policy', value: { pol: 'POL-001' } });
  iep.memory.put('personal', { key: 'pref', scope: 'user-1', value: { theme: 'dark' } });

  assert.equal(iep.memory.get('working', 'draft', 'p1').value.x, 1);
  assert.equal(iep.memory.get('project', 'decision', 'p1').value.edr, 'EDR-006');
  assert.equal(iep.memory.get('working', 'decision', 'p1'), null);

  const snap = iep.memory.snapshot({ projectId: 'p1', actor: 'user-1' });
  assert.ok(snap.working.length >= 1);
  assert.ok(snap.project.length >= 1);
  assert.ok(snap.personal.length >= 1);
});

test('sessions create and expire semantics', () => {
  const iep = createIEP();
  const s = iep.sessions.create({ projectId: 'p1', actor: 'dev' });
  assert.ok(iep.sessions.get(s.id));
  iep.sessions.close(s.id);
  assert.equal(iep.sessions.get(s.id), null);
});

test('cache hit/miss stats', () => {
  const iep = createIEP();
  assert.equal(iep.cache.get('k'), undefined);
  iep.cache.set('k', 42);
  assert.equal(iep.cache.get('k'), 42);
  const stats = iep.cache.stats();
  assert.equal(stats.hits, 1);
  assert.equal(stats.misses, 1);
});

test('agent runtime loads config and runs full lifecycle', async () => {
  const iep = createIEP();
  assert.deepEqual(AGENT_LIFECYCLE, AGENT_STEPS);

  const defined = defineAgent({
    id: 'agent.business-analyst',
    version: '0.1.0',
    metadata: {
      role: 'business-analyst',
      layer: 'thinking',
      skills: ['skill.platform.http'],
      models: ['stub'],
      budget: { maxTokens: 50_000 },
    },
    execute: async (state) => ({
      output: {
        type: 'document.prd',
        content: { from: state.config.role, goals: state.bundle?.goals ?? [] },
      },
      tokens: 120,
    }),
    validate: async (state) => ({
      validation: { passed: true, score: 95 },
      output: state.output,
    }),
  });

  iep.agents.register(defined.config, defined.impl);

  const result = await iep.agents.run('agent.business-analyst', {
    projectId: 'proj-agent',
    bundle: { goals: ['ship iep'] },
  });
  assert.equal(result.output.type, 'document.prd');
  assert.equal(result.validation.score, 95);
  assert.equal(result.learned, true);
  assert.ok(iep.memory.get('project', 'agent:agent.business-analyst:last', 'proj-agent'));
});

test('agents are jobs: scheduleAgent + orchestrator', async () => {
  const iep = createIEP();
  iep.agents.register({
    id: 'agent.architect',
    role: 'system-architect',
    layer: 'thinking',
    budget: { maxTokens: 10_000, model: 'stub' },
    models: ['stub'],
  }, {
    execute: async (state) => ({
      output: { type: 'document.architecture', content: { style: 'modular-monolith' } },
      tokens: 50,
    }),
  });

  iep.scheduler.scheduleAgent({
    agentId: 'agent.architect',
    projectId: 'proj-jobs',
    payload: { input: { module: 'core' }, model: 'stub', estimatedTokens: 50 },
    priority: 80,
  });

  const run = await iep.orchestrator.runUntilIdle();
  assert.equal(run.results.length, 1);
  assert.equal(run.results[0].ok, true);
  assert.equal(run.results[0].result.output.type, 'document.architecture');

  const replay = run.results[0].replay;
  assert.equal(replay.agentId, 'agent.architect');
  assert.ok(replay.cost);
});

test('failed job retries then dead-letters', async () => {
  const iep = createIEP();
  let attempts = 0;
  iep.scheduler.register('flaky', async () => {
    attempts += 1;
    throw new Error('boom');
  });
  iep.queue.enqueue({ type: 'flaky', projectId: 'p-fail', maxAttempts: 2, payload: {} });

  // drain multiple times to consume retries
  await iep.orchestrator.runUntilIdle({ maxSteps: 5 });
  assert.ok(attempts >= 2);
  const dead = iep.queue.list({ state: 'dead' });
  assert.equal(dead.length, 1);
  const kpis = iep.kpis({ projectId: 'p-fail' });
  assert.ok(kpis.failures >= 1);
});

test('DAG run: analyst then architect jobs', async () => {
  const iep = createIEP();
  const trail = [];
  iep.agents.register({ id: 'ba', role: 'business-analyst' }, {
    execute: async () => {
      trail.push('ba');
      return { output: { prd: true }, tokens: 10 };
    },
  });
  iep.agents.register({ id: 'arch', role: 'system-architect' }, {
    execute: async () => {
      trail.push('arch');
      return { output: { arch: true }, tokens: 10 };
    },
  });

  const j1 = { id: 'job-ba', type: 'agent.run', agentId: 'ba', projectId: 'dag', payload: {} };
  const j2 = { id: 'job-arch', type: 'agent.run', agentId: 'arch', projectId: 'dag', payload: {}, dependsOn: ['job-ba'] };
  await iep.orchestrator.runDag([j1, j2]);
  assert.deepEqual(trail, ['ba', 'arch']);
});
