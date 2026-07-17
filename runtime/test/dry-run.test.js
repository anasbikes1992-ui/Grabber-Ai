// Acceptance tests for Runtime Sprint 1 (docs/04 §9, EDR-001).
// The headline test is §9.7: a dry-run project traverses Discovery →
// Architecture on synthetic data with zero manual intervention.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../src/events/bus.js';
import { ArtifactRegistry, RegistryRejection } from '../src/artifacts/registry.js';
import { ProjectStateMachine } from '../src/state-machine/machine.js';
import { ContextEngine, BundleRejection } from '../src/context/engine.js';
import { ValidationRuntime } from '../src/validation/runtime.js';
import { PolicyEngine, securityDeploymentPolicy } from '../src/policy/engine.js';
import { Telemetry } from '../src/telemetry/recorder.js';
import { SystemHealth } from '../src/health/monitor.js';
import { ExecutionEngine } from '../src/orchestration/execution-engine.js';

// ── shared fixtures ────────────────────────────────────────────────────
const AGENT_LAYERS = {
  'business-analyst': 'thinking',
  'system-architect': 'thinking',
  'backend-worker': 'building',
  'validation-runtime': 'verification',
};

const constraints = {
  must: ['derive from DNA'], should: [], may: [], must_not: ['invent APIs'],
  assumptions: [], unknowns: [], risks: [],
};
const standards = [{ id: '13-DOCUMENTATION', version: '1.0.0', rules: ['DC-05'] }];

function buildPlatform() {
  const bus = new EventBus();
  const machine = new ProjectStateMachine(bus, {
    gateThresholds: { intake: 90, discovery: 90, analysis: 90, requirements: 90, architecture: 90 },
  });
  const registry = new ArtifactRegistry(bus, {
    stageOf: (p) => machine.stageOf(p),
    layerOf: (agent) => AGENT_LAYERS[agent],
  });
  const context = new ContextEngine({ standardsVersion: 'stds-1.0.0' });
  const validation = new ValidationRuntime(bus, registry);
  const policy = new PolicyEngine(bus);
  const telemetry = new Telemetry();
  const health = new SystemHealth({ bus, telemetry, contextEngine: context });

  // Rubrics (VR-01): synthetic but structured — score + findings per rule.
  const passing = () => ({ score: 100, findings: [{ rule: 'DC-05', passed: true }] });
  for (const step of ['syntax', 'standards', 'documentation', 'completion']) validation.register(step, passing);

  return { bus, machine, registry, context, validation, policy, telemetry, health };
}

const thinkingTask = (name, agent, outputType) => ({
  name, agent, outputType,
  dnaSections: { industry: 'retail', goals: ['bookings'] },
  constraints, standards,
});

const stageWorkflow = (task) => ({
  tasks: [task],
  gateThreshold: 90,
  applicableSteps: ['syntax', 'standards', 'documentation', 'completion'],
});

const stubAgent = (outputType) => (bundle) => ({
  type: outputType,
  inputs: [], outputs_declared: ['AC-goal-1'], dependencies: [],
  related_standards: ['DC-05'], related_edrs: [],
  derives_from: ['dna:industry', 'dna:goals'],
  content: { producedFrom: bundle.provenance.inputs_hash },
});

// ── §9.7 the dry run ───────────────────────────────────────────────────
test('acceptance §9.7: dry-run traverses intake → discovery → … → architecture gate with zero manual intervention', () => {
  const p = buildPlatform();
  p.machine.createProject({ id: 'proj-dryrun', dna: { industry: 'retail' } });

  const workflows = {
    intake: stageWorkflow(thinkingTask('qualify', 'business-analyst', 'document.plan')),
    discovery: stageWorkflow(thinkingTask('discover', 'business-analyst', 'document.prd')),
    analysis: stageWorkflow(thinkingTask('analyze', 'business-analyst', 'document.prd')),
    requirements: stageWorkflow(thinkingTask('specify', 'business-analyst', 'document.prd')),
    architecture: stageWorkflow(thinkingTask('design', 'system-architect', 'document.architecture')),
  };
  const agents = {
    'business-analyst': stubAgent('document.prd'),
    'system-architect': stubAgent('document.architecture'),
  };
  // intake produces a plan, not a prd:
  agents['business-analyst'] = (bundle) => stubAgent(bundle.output_contract.type)(bundle);
  agents['system-architect'] = (bundle) => stubAgent(bundle.output_contract.type)(bundle);

  const engine = new ExecutionEngine({ ...p, workflows, agents });

  for (const expected of ['intake', 'discovery', 'analysis', 'requirements', 'architecture']) {
    assert.equal(p.machine.stageOf('proj-dryrun'), expected);
    const result = engine.runStage('proj-dryrun');
    assert.equal(result.passed, true, `stage ${expected} must pass`);
  }
  assert.equal(p.machine.stageOf('proj-dryrun'), 'planning'); // advanced past architecture

  // Provenance end-to-end (§9.4, CE-06, OB-10):
  for (const a of p.registry.query({ project: 'proj-dryrun' })) {
    assert.ok(a.producer.context_bundle.startsWith('ctx_'));
    assert.ok(p.context.get(a.producer.context_bundle), 'bundle stored and queryable');
  }
  // Telemetry (§ metrics): zero manual interventions.
  assert.equal(p.telemetry.metrics('proj-dryrun').manual_interventions, 0);
  // Event log is replayable (§9.1) and gate-driven transitions only (§9.3):
  const transitions = p.bus.replay((e) => e.type === 'state.transitioned' && e.project === 'proj-dryrun');
  assert.equal(transitions.length, 5);
});

// ── Article VI: layer separation enforced by type ──────────────────────
test('a thinking agent emitting code.module is rejected by the registry', () => {
  const p = buildPlatform();
  p.machine.createProject({ id: 'proj-layer', dna: {} });
  assert.throws(
    () => p.registry.put({
      type: 'code.module', project: 'proj-layer', stage: 'intake',
      producer: { agent: 'business-analyst', prompt_version: '1', standards_version: '1', context_bundle: 'ctx_x' },
      inputs: [], outputs_declared: [], dependencies: [], related_standards: [], related_edrs: [],
      derives_from: ['dna:x'], content: 'export const x = 1;',
    }),
    (err) => err instanceof RegistryRejection && /layer violation/.test(err.message),
  );
});

// ── INV-3: no artifacts for unreached stages ───────────────────────────
test('artifact for a stage the project has not reached is rejected (INV-3)', () => {
  const p = buildPlatform();
  p.machine.createProject({ id: 'proj-stage', dna: {} });
  assert.throws(
    () => p.registry.put({
      type: 'document.prd', project: 'proj-stage', stage: 'development',
      producer: { agent: 'business-analyst', prompt_version: '1', standards_version: '1', context_bundle: 'ctx_x' },
      inputs: [], outputs_declared: [], dependencies: [], related_standards: [], related_edrs: [],
      derives_from: ['dna:x'], content: {},
    }),
    /stage mismatch/,
  );
});

// ── SM-02 + Article VI: loopback then escalation ───────────────────────
test('gate failure loops back with corrections; second failure escalates', () => {
  const p = buildPlatform();
  p.machine.createProject({ id: 'proj-fail', dna: {} });
  const r1 = p.machine.gateFailed('proj-fail', 'intake', { score: 40, corrections: [{ rule: 'DC-05', correction: 'add owner' }] });
  assert.equal(r1, 'loopback');
  assert.equal(p.machine.stageOf('proj-fail'), 'intake'); // stayed
  const r2 = p.machine.gateFailed('proj-fail', 'intake', { score: 45 });
  assert.equal(r2, 'escalated');
  assert.throws(() => p.machine.gatePassed('proj-fail', 'intake', { score: 99 }), /escalated/); // INV-4
  p.machine.resolveEscalation('proj-fail', 'owner:anaz');
  assert.equal(p.machine.gatePassed('proj-fail', 'intake', { score: 99 }), 'discovery');
});

// ── Article VII.2: asserted scores below threshold are refused ─────────
test('gate.passed with a sub-threshold score is refused by the state machine', () => {
  const p = buildPlatform();
  p.machine.createProject({ id: 'proj-gate', dna: {} });
  assert.throws(() => p.machine.gatePassed('proj-gate', 'intake', { score: 50 }), /below threshold/);
});

// ── PR-04: constraint block is mandatory pre-dispatch ──────────────────
test('bundle without a constraint block is rejected before dispatch', () => {
  const p = buildPlatform();
  assert.throws(
    () => p.context.assemble({ task: { type: 't' }, agent: 'business-analyst', dnaSections: { a: 1 }, constraints: null, standards, outputContract: { type: 'document.prd' } }),
    (err) => err instanceof BundleRejection && /constraint block missing/.test(err.message),
  );
});

// ── CE-01: determinism ─────────────────────────────────────────────────
test('identical inputs produce identical bundle hashes', () => {
  const p = buildPlatform();
  const args = { task: { type: 't' }, agent: 'business-analyst', dnaSections: { a: 1 }, constraints, standards, outputContract: { type: 'document.prd' } };
  const h1 = p.context.assemble(args).provenance.inputs_hash;
  const h2 = p.context.assemble(args).provenance.inputs_hash;
  assert.equal(h1, h2);
});

// ── Policy Engine: EDR-001's canonical policy ──────────────────────────
test('security gate failure blocks deployment until exception or re-pass', () => {
  const p = buildPlatform();
  p.policy.register(securityDeploymentPolicy);
  p.machine.createProject({ id: 'proj-pol', dna: {} });
  // Simulate a security-stage failure event:
  p.bus.emit({ type: 'gate.failed', project: 'proj-pol', stage: 'security', actor: 'validation-runtime', payload: { score: 80 } });
  assert.equal(p.policy.isBlocked('proj-pol', 'deploy'), 'POL-001-security-blocks-deployment');
  const triggered = p.bus.replay((e) => e.type === 'governance.policy_triggered');
  assert.equal(triggered.length, 1);
  assert.equal(triggered[0].payload.severity, 'critical');
  assert.ok(p.policy.openIssues.length === 1);
  p.policy.unblock('proj-pol', 'deploy', 'owner:anaz'); // exception path (audited)
  assert.equal(p.policy.isBlocked('proj-pol', 'deploy'), null);
});

// ── VR-04 + AM: approval impossible without validation ─────────────────
test('approving an unvalidated artifact is impossible by schema', () => {
  const p = buildPlatform();
  p.machine.createProject({ id: 'proj-appr', dna: {} });
  const id = p.registry.put({
    type: 'document.prd', project: 'proj-appr', stage: 'intake',
    producer: { agent: 'business-analyst', prompt_version: '1', standards_version: '1', context_bundle: 'ctx_x' },
    inputs: [], outputs_declared: [], dependencies: [], related_standards: [], related_edrs: [],
    derives_from: ['dna:x'], content: {},
  });
  assert.throws(() => p.registry.approve(id, 'anyone'), /validation status is "pending"/);
});

// ── SM-06: closure requires learning merged ────────────────────────────
test('a project cannot close without its learning report merged', () => {
  const p = buildPlatform();
  p.machine.createProject({ id: 'proj-close', dna: {} });
  assert.throws(() => p.machine.close('proj-close', 'owner'), /learning report not merged/);
  p.bus.emit({ type: 'learning.report_ready', project: 'proj-close', actor: 'learning-engine' });
  p.bus.emit({ type: 'knowledge.entry_merged', project: 'proj-close', actor: 'learning-engine' });
  p.machine.close('proj-close', 'owner');
  assert.equal(p.machine.stageOf('proj-close'), 'closed');
});

// ── System Health snapshot ─────────────────────────────────────────────
test('system health reports platform metrics', () => {
  const p = buildPlatform();
  p.machine.createProject({ id: 'proj-health', dna: {} });
  p.machine.gateFailed('proj-health', 'intake', { score: 10 });
  const snap = p.health.snapshot();
  assert.ok(snap.event_queue_depth >= 2);
  assert.equal(snap.validation_failures, 1);
  assert.ok(snap.gate_success_rate < 1);
});
