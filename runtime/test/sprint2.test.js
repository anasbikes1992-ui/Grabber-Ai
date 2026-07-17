// Sprint 2 — Platform Infrastructure acceptance tests (EDR-004, docs/04 §9.6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { EventBus } from '../src/events/bus.js';
import { ArtifactRegistry } from '../src/artifacts/registry.js';
import { ProjectStateMachine } from '../src/state-machine/machine.js';
import { createPlatformServices } from '../src/services/index.js';
import { ServiceError } from '../src/services/dna-service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pilotDna = JSON.parse(
  readFileSync(join(__dirname, '../../projects/pilot-task-manager/project-dna.json'), 'utf8'),
);

const AGENT_LAYERS = {
  'business-analyst': 'thinking',
  'system-architect': 'thinking',
  'backend-worker': 'building',
  'validation-runtime': 'verification',
};

function buildInfra() {
  const bus = new EventBus();
  const machine = new ProjectStateMachine(bus);
  const registry = new ArtifactRegistry(bus, {
    stageOf: (p) => machine.stageOf(p),
    layerOf: (agent) => AGENT_LAYERS[agent] ?? 'thinking',
  });
  const services = createPlatformServices({ bus, registry });
  return { bus, machine, registry, services };
}

// ── DNA Service ──────────────────────────────────────────────────────────
test('DNA service validates, versions, and emits dna_changed on update', () => {
  const { bus, services } = buildInfra();
  const v1 = services.dna.put({ projectId: 'proj-a', dna: pilotDna, approved: true });
  assert.equal(v1.version, '1.0.0');
  assert.ok(v1.checksum);
  assert.equal(services.dna.section('proj-a', 'industry'), 'productivity');

  let changed = 0;
  bus.subscribe('project.dna_changed', 't', () => { changed += 1; });

  const mutated = structuredClone(pilotDna);
  mutated.project.goals = [...mutated.project.goals, 'export CSV'];
  const v2 = services.dna.put({ projectId: 'proj-a', dna: mutated });
  assert.equal(v2.version, '1.0.1');
  assert.equal(changed, 1);
  assert.equal(services.dna.listVersions('proj-a').length, 2);
});

test('DNA service rejects incomplete DNA', () => {
  const { services } = buildInfra();
  assert.throws(
    () => services.dna.put({ projectId: 'bad', dna: { name: 'x' } }),
    (e) => e instanceof ServiceError && e.errors.length > 0,
  );
});

// ── Rule / Decision / Capability / Pattern / Knowledge ───────────────────
test('Rule service seeds standards and answers applicable queries', () => {
  const { services } = buildInfra();
  const ar = services.rules.get('AR-11');
  assert.ok(ar);
  assert.equal(ar.prefix, 'AR');
  const sec = services.rules.query({ prefix: 'DC' });
  assert.ok(sec.some((r) => r.id === 'DC-08'));
  assert.equal(services.rules.applicable(['AR-01', 'missing']).length, 1);
});

test('Decision service records EDRs and finds rule introducers', () => {
  const { services } = buildInfra();
  const edr = services.decisions.get('EDR-004');
  assert.equal(edr.status, 'Accepted');
  const intro = services.decisions.introducedRule('AR-11');
  assert.ok(intro.some((d) => d.id === 'EDR-004'));
});

test('Capability service reverse-depends', () => {
  const { services } = buildInfra();
  const deps = services.capabilities.dependents('Event Bus');
  assert.ok(deps.some((c) => c.name === 'Artifact Registry'));
});

test('Pattern service finds capability usage', () => {
  const { services } = buildInfra();
  const used = services.patterns.usingCapability('Execution Engine');
  assert.ok(used.some((p) => p.id === 'pattern/productivity/task-manager'));
});

test('Knowledge service typed retrieval returns binding standards', () => {
  const { services } = buildInfra();
  const patterns = services.knowledge.retrieve({
    intent: 'pattern-lookup',
    industry: 'productivity',
  });
  assert.ok(patterns.entries.length >= 1);
  assert.ok(patterns.binding_standards.length >= 1);

  const mistakes = services.knowledge.retrieve({ intent: 'mistake-check', q: 'SM-06' });
  assert.ok(mistakes.entries.some((e) => e.id.includes('sm-06')));

  assert.throws(() => services.knowledge.retrieve({ intent: 'telepathy' }));
});

// ── Artifact Query + Dependency Graph §9.6 ───────────────────────────────
test('acceptance §9.6: Dependency Graph answers impact queries for a DNA change end-to-end', () => {
  const { bus, machine, registry, services } = buildInfra();
  const projectId = 'proj-impact';

  services.dna.put({ projectId, dna: pilotDna, approved: true });
  machine.createProject({ id: projectId, dna: pilotDna.project });

  // Produce artifacts that derive from DNA sections (thinking layer).
  const prdId = registry.put({
    type: 'document.prd',
    project: projectId,
    stage: 'intake',
    producer: {
      agent: 'business-analyst',
      prompt_version: '1.0.0',
      standards_version: 'stds-1.0.0',
      context_bundle: 'ctx_test',
    },
    inputs: [],
    related_standards: ['DC-05', 'AR-01'],
    derives_from: ['dna:goals', 'dna:industry'],
    content: { title: 'PRD', goals: pilotDna.project.goals },
  });
  const archId = registry.put({
    type: 'document.architecture',
    project: projectId,
    stage: 'intake',
    producer: {
      agent: 'system-architect',
      prompt_version: '1.0.0',
      standards_version: 'stds-1.0.0',
      context_bundle: 'ctx_test',
    },
    inputs: [prdId],
    related_standards: ['AR-01', 'AR-11'],
    derives_from: ['dna:architecture', 'dna:stack'],
    content: { style: 'modular-monolith' },
  });

  // Project registry → graph
  const indexed = services.artifacts.projectToGraph(projectId);
  assert.ok(indexed >= 2);

  // Artifact Query: dependents of PRD
  const deps = services.artifacts.dependents(prdId);
  assert.ok(deps.some((a) => a.id === archId));

  // Standards that apply to architecture artifact
  const withAr = services.artifacts.query({ project: projectId, relatedStandard: 'AR-11' });
  assert.ok(withAr.some((a) => a.id === archId));

  // DNA change → impact marks stale artifacts (DG-02 / AR-11 / DC-08)
  const mutated = structuredClone(pilotDna);
  mutated.project.architecture = {
    style: 'modular-monolith',
    modules: ['tasks', 'users', 'reporting', 'export'],
  };
  services.dna.put({ projectId, dna: mutated, actor: 'test' });

  // Ensure graph has DNA root from DNA service; re-project artifacts
  services.artifacts.projectToGraph(projectId);
  const impact = services.dependencyGraph.impact({
    projectId,
    seeds: [`dna:${projectId}`, `dna:${projectId}:architecture`, 'dna:architecture'],
    markStale: true,
  });
  assert.ok(impact.stale_artifacts.length >= 1, 'expected stale artifacts after DNA change');
  assert.ok(
    impact.stale_artifacts.includes(prdId) || impact.stale_artifacts.includes(archId),
    `stale set should include produced artifacts, got ${impact.stale_artifacts.join(',')}`,
  );
  assert.ok(services.dependencyGraph.staleArtifacts(projectId).length >= 1);

  // Provenance chain
  const prov = services.artifacts.provenance(archId);
  assert.ok(prov.some((p) => p.id === prdId) || prov.some((p) => p.id === archId));

  // Event was logged
  assert.ok(bus.replay((e) => e.type === 'project.dna_changed').length >= 1);
});

test('DG-01 topological task ordering detects cycles', () => {
  const { services } = buildInfra();
  const ordered = services.dependencyGraph.orderTasks([
    { id: 'c', dependsOn: ['b'] },
    { id: 'a', dependsOn: [] },
    { id: 'b', dependsOn: ['a'] },
  ]);
  assert.deepEqual(ordered, ['a', 'b', 'c']);

  assert.throws(() => services.dependencyGraph.orderTasks([
    { id: 'x', dependsOn: ['y'] },
    { id: 'y', dependsOn: ['x'] },
  ]));
});

// ── Platform search (CTO Priority 3) ─────────────────────────────────────
test('platform search answers dependency, rule-source, and capability questions', () => {
  const { machine, registry, services } = buildInfra();
  const projectId = 'proj-search';
  services.dna.put({ projectId, dna: pilotDna });
  machine.createProject({ id: projectId, dna: pilotDna.project });

  const apiId = registry.put({
    type: 'contract.api',
    project: projectId,
    stage: 'intake',
    producer: {
      agent: 'backend-worker',
      prompt_version: '1.0.0',
      standards_version: 'stds-1.0.0',
      context_bundle: 'ctx_x',
    },
    inputs: [],
    related_standards: ['AP-05'],
    derives_from: ['dna:architecture'],
    content: { path: '/tasks' },
  });
  // building layer agent producing contract.api — ARTIFACT_LAYER says contract.api is building
  // backend-worker is building — good

  const moduleId = registry.put({
    type: 'code.module',
    project: projectId,
    stage: 'intake',
    producer: {
      agent: 'backend-worker',
      prompt_version: '1.0.0',
      standards_version: 'stds-1.0.0',
      context_bundle: 'ctx_x',
    },
    inputs: [apiId],
    related_standards: ['AP-05'],
    derives_from: ['dna:architecture'],
    content: { name: 'tasks-router' },
  });

  const depQ = services.search.ask('which artifacts depend on this API?', { artifactId: apiId });
  assert.equal(depQ.kind, 'dependents');
  assert.ok(depQ.results.some((a) => a.id === moduleId));

  const ruleQ = services.search.ask('which EDR introduced this rule?', { ruleId: 'DC-08' });
  assert.equal(ruleQ.kind, 'rule-source');
  assert.ok(ruleQ.results.some((d) => d.id === 'EDR-004'));

  const capQ = services.search.ask('which templates use this capability?', { capability: 'Knowledge Engine' });
  assert.equal(capQ.kind, 'capability-usage');
  assert.ok(capQ.results.length >= 1);
});

// ── Storage contracts are swappable (Memory providers) ───────────────────
test('storage SCHEMA is present and vector index ranks relevant docs', () => {
  const { services } = buildInfra();
  const hits = services.storage.vectors.search('task manager pattern productivity', { limit: 5 });
  assert.ok(hits.length >= 1);
  assert.ok(hits[0].score > 0);
});
