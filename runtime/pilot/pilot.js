// pilot/pilot.js — EDR-003: the pilot project.
// A brand-new Project DNA file (projects/pilot-task-manager) travels the FULL
// runtime: intake → … → deployment → monitoring → improvement → closed.
// Agents are deterministic stand-ins (real agents arrive in Sprint 3); what is
// being validated is the PLATFORM: DNA → Execution → Artifacts → Validation →
// Policies → State → Learning → Closure.
//
// Run: node pilot/pilot.js
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EventBus } from '../src/events/bus.js';
import { ArtifactRegistry } from '../src/artifacts/registry.js';
import { ProjectStateMachine } from '../src/state-machine/machine.js';
import { ContextEngine } from '../src/context/engine.js';
import { ValidationRuntime } from '../src/validation/runtime.js';
import { PolicyEngine, securityDeploymentPolicy } from '../src/policy/engine.js';
import { Telemetry } from '../src/telemetry/recorder.js';
import { SystemHealth } from '../src/health/monitor.js';
import { ExecutionEngine } from '../src/orchestration/execution-engine.js';

const here = dirname(fileURLToPath(import.meta.url));
const DNA = JSON.parse(readFileSync(join(here, '../../projects/pilot-task-manager/project-dna.json'), 'utf8')).project;
const PROJECT = DNA.name;

// ── Agents (layer-bound, deterministic; AG-01: bundle in, artifact out) ──
const AGENT_LAYERS = {
  'business-analyst': 'thinking', 'system-architect': 'thinking', 'planner': 'thinking',
  'database-worker': 'building', 'backend-worker': 'building', 'qa-worker': 'building', 'devops-worker': 'building',
  'security-validator': 'verification', 'learning-reporter': 'verification',
  'knowledge-curator': 'learning',
};

let qaAttempt = 0; // demonstrates gate loopback (SM-02): first test suite under-covers.

const CONTENT = {
  'document.plan': (b) => ({ kind: 'plan', tasks: DNA.critical_flows, from: b.provenance.inputs_hash }),
  'document.prd': () => ({ kind: 'prd', users: DNA.users, goals: DNA.goals, flows: DNA.critical_flows }),
  'document.architecture': () => ({ kind: 'architecture', style: DNA.architecture.style, modules: DNA.architecture.modules, stack: DNA.stack }),
  'design.system': () => ({ kind: 'tokens', breakpoints: DNA.conventions.breakpoints, a11y: DNA.accessibility_level }),
  'schema.database': () => ({ kind: 'schema', naming: DNA.conventions.db_naming, tables: ['tasks', 'users'], rls: 'per-table policies declared (DB-06)' }),
  'contract.api': () => ({ kind: 'openapi', envelope: DNA.conventions.api_envelope, resources: ['/tasks', '/users'] }),
  'code.module': () => ({ kind: 'module', modules: DNA.architecture.modules }),
  'suite.test': (b) => b.task.type === 'write-tests'
    ? { kind: 'tests', coverage: ++qaAttempt === 1 ? 82 : 96, criticalFlows: DNA.critical_flows }
    : { kind: 'load-test', p95_ms: 240, budget_ms: DNA.performance_targets.api_p95_ms },
  'report.security': () => ({ kind: 'security-audit', findings: [], owaspSuite: 'passed' }),
  'config.pipeline': (b) => ({ kind: b.task.type === 'observability' ? 'monitoring-config' : 'ci-cd', environments: DNA.deployment_targets.environments, rollback: 'one-command (DO-07)' }),
  'docs.delivered': () => ({ kind: 'runbook', commands: ['deploy', 'rollback'], escalation: 'owner' }),
  'report.learning': () => ({ kind: 'learning', wentWell: ['zero manual interventions'], reused: ['crud-dashboard decision rule'] }),
  'knowledge.entry': () => ({ kind: 'pattern-proposal', pattern: 'task-crud', generalized: true }),
};

const makeAgent = () => (bundle) => ({
  type: bundle.output_contract.type,
  inputs: bundle.artifacts.map((a) => a.id ?? a),
  outputs_declared: DNA.critical_flows.map((f) => `AC:${f}`),
  dependencies: [],
  related_standards: bundle.standards.flatMap((s) => s.rules),
  related_edrs: ['EDR-003'],
  derives_from: Object.keys(bundle.project_dna).map((k) => `dna:${k}`),
  content: CONTENT[bundle.output_contract.type](bundle),
});

// ── Stage workflows (RT-02: stage logic lives here, not in the engine) ──
const GATES = { intake: 90, discovery: 90, analysis: 90, requirements: 90, architecture: 90, planning: 90, design_system: 90, data_architecture: 95, development: 90, verification: 95, security: 98, performance: 90, deployment: 100, monitoring: 95, improvement: 90 };

const task = (type, agent, outputType, dnaKeys, rules) => ({
  name: type, agent, outputType,
  dnaSections: Object.fromEntries(dnaKeys.map((k) => [k, DNA[k]])),
  constraints: DNA.constraints,
  standards: [{ id: rules[0].split('-')[0] === 'S' ? '05-SECURITY' : 'bound-standards', version: '1.0.0', rules }],
});

const WORKFLOWS = {
  intake: [task('qualify', 'business-analyst', 'document.plan', ['name', 'goals', 'stack'], ['DC-05'])],
  discovery: [task('discover', 'business-analyst', 'document.prd', ['users', 'goals'], ['DC-05'])],
  analysis: [task('analyze', 'business-analyst', 'document.prd', ['goals', 'risks'], ['DC-05'])],
  requirements: [task('specify', 'business-analyst', 'document.prd', ['users', 'goals', 'critical_flows'], ['DC-05'])],
  architecture: [task('design', 'system-architect', 'document.architecture', ['architecture', 'stack'], ['AR-01', 'AR-09'])],
  planning: [task('plan', 'planner', 'document.plan', ['critical_flows', 'goals'], ['DC-05'])],
  design_system: [task('tokens', 'system-architect', 'design.system', ['conventions', 'accessibility_level'], ['UI-01', 'AC-01'])],
  data_architecture: [task('schema', 'database-worker', 'schema.database', ['conventions', 'data'], ['DB-02', 'DB-06'])],
  development: [
    task('api-contract', 'backend-worker', 'contract.api', ['conventions', 'architecture'], ['AP-01', 'AP-05']),
    task('implement', 'backend-worker', 'code.module', ['architecture', 'critical_flows'], ['CO-01', 'EH-03']),
  ],
  verification: [task('write-tests', 'qa-worker', 'suite.test', ['critical_flows'], ['TS-02', 'TS-04'])],
  security: [task('audit', 'security-validator', 'report.security', ['security_level', 'authorization'], ['S-14'])],
  performance: [task('load-test', 'qa-worker', 'suite.test', ['performance_targets'], ['PF-06', 'PF-10'])],
  deployment: [
    task('pipeline', 'devops-worker', 'config.pipeline', ['deployment_targets'], ['DO-01', 'DO-07']),
    task('runbook', 'devops-worker', 'docs.delivered', ['deployment_targets'], ['DC-03']),
  ],
  monitoring: [task('observability', 'devops-worker', 'config.pipeline', ['deployment_targets', 'performance_targets'], ['OB-04', 'OB-07'])],
  improvement: [
    task('learning-report', 'learning-reporter', 'report.learning', ['goals'], ['DC-05']),
    task('knowledge-merge', 'knowledge-curator', 'knowledge.entry', ['goals', 'industry'], ['DC-09']),
  ],
};

// ── Rubrics (VR-01: synthetic but structured) ────────────────────────────
function registerRubrics(validation) {
  const pass = (rule) => () => ({ score: 100, findings: [{ rule, passed: true }] });
  validation.register('syntax', (a) => ({ score: a.content ? 100 : 0, findings: [{ rule: 'CO-08', passed: !!a.content }] }));
  validation.register('standards', (a) => ({ score: a.related_standards.length ? 100 : 0, findings: [{ rule: 'PR-02', passed: !!a.related_standards.length }] }));
  validation.register('architecture', pass('AR-09'));
  validation.register('security', (a) => a.content?.insecure
    ? { score: 0, findings: [{ rule: 'S-14', passed: false, severity: 'critical' }] }
    : { score: 100, findings: [{ rule: 'S-14', passed: true }] });
  validation.register('performance', pass('PF-01'));
  validation.register('accessibility', pass('AC-01'));
  validation.register('documentation', pass('DC-05'));
  validation.register('completion', (a) => {
    const coverage = a.content?.coverage;
    if (coverage !== undefined && coverage < 95) {
      return { score: 0, findings: [{ rule: 'TS-02', passed: false, correction: `coverage ${coverage}% < 95% floor — raise coverage (TS-02)` }] };
    }
    return { score: 100, findings: [{ rule: 'TS-03', passed: true }] };
  });
}

// ── The pilot run ────────────────────────────────────────────────────────
export function runPilot({ log = () => {} } = {}) {
  const bus = new EventBus();
  const machine = new ProjectStateMachine(bus, { gateThresholds: GATES });
  const registry = new ArtifactRegistry(bus, { stageOf: (p) => machine.stageOf(p), layerOf: (a) => AGENT_LAYERS[a] });
  const context = new ContextEngine({ standardsVersion: DNA.standards_version });
  const validation = new ValidationRuntime(bus, registry);
  const policy = new PolicyEngine(bus);
  const telemetry = new Telemetry();
  const health = new SystemHealth({ bus, telemetry, contextEngine: context });
  registerRubrics(validation);
  policy.register(securityDeploymentPolicy);

  const agents = Object.fromEntries(Object.keys(AGENT_LAYERS).map((name) => [name, makeAgent()]));
  const workflows = Object.fromEntries(Object.entries(WORKFLOWS).map(([stage, tasks]) => [stage, { tasks, gateThreshold: GATES[stage] }]));
  const engine = new ExecutionEngine({ bus, registry, machine, context, validation, policy, telemetry, workflows, agents });

  machine.createProject({ id: PROJECT, dna: DNA });
  qaAttempt = 0;
  let loopbacks = 0;
  let guard = 0;

  while (machine.stageOf(PROJECT) !== 'closed') {
    if (++guard > 40) throw new Error('pilot did not converge');
    const stage = machine.stageOf(PROJECT);
    if (stage === 'improvement') {
      // Learning Engine responsibilities (02-JARVIS §8) — stand-in until Sprint 3:
      bus.emit({ type: 'learning.report_ready', project: PROJECT, stage, actor: 'learning-reporter' });
      bus.emit({ type: 'knowledge.entry_merged', project: PROJECT, stage, actor: 'knowledge-curator' });
    }
    const result = engine.runStage(PROJECT);
    log(`${stage.padEnd(18)} ${result.passed ? '✅ pass' : `↩ loopback`}  score=${result.score}`);
    if (!result.passed) loopbacks += 1;
  }

  const artifacts = registry.query({ project: PROJECT });
  return {
    project: PROJECT,
    finalState: machine.stageOf(PROJECT),
    stagesTraversed: bus.replay((e) => e.type === 'state.transitioned' && e.project === PROJECT).length,
    loopbacks,
    artifacts: {
      total: artifacts.length,
      approved: artifacts.filter((a) => a.state === 'approved').length,
      byType: artifacts.reduce((m, a) => ((m[a.type] = (m[a.type] ?? 0) + 1), m), {}),
      provenanceComplete: artifacts.every((a) => a.producer.context_bundle && a.derives_from.length > 0),
    },
    policies: { deployBlocked: policy.isBlocked(PROJECT, 'deploy'), openIssues: policy.openIssues.length },
    telemetry: telemetry.metrics(PROJECT),
    health: health.snapshot(),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = runPilot({ log: console.log });
  console.log('\n=== PILOT REPORT (EDR-003) ===');
  console.log(JSON.stringify(report, null, 2));
  const q = report.finalState === 'closed' && report.artifacts.provenanceComplete && report.telemetry.manual_interventions === 0;
  console.log(`\nCan a brand-new Project DNA file travel through the runtime end-to-end? ${q ? 'YES ✅' : 'NO ❌'}`);
}
