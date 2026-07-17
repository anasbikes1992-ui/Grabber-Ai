// services/index.js — Platform Foundation APIs factory (EDR-004 / Sprint 2).
// Every future feature depends on these services. Nothing outside this
// surface should reach into storage or registry internals.

import { createDefaultStorage } from '../storage/store.js';
import { DnaService } from './dna-service.js';
import { RuleService } from './rule-service.js';
import { DecisionService } from './decision-service.js';
import { CapabilityService } from './capability-service.js';
import { PatternService } from './pattern-service.js';
import { KnowledgeService } from './knowledge-service.js';
import { ArtifactQueryService } from './artifact-query-service.js';
import { DependencyGraphService } from './dependency-graph-service.js';

/**
 * Build the Platform Infrastructure service bundle.
 * @param {{
 *   bus?: import('../events/bus.js').EventBus,
 *   registry?: { get: Function, query: Function },
 *   storage?: ReturnType<typeof createDefaultStorage>,
 *   seedPlatform?: boolean,
 * }} [opts]
 */
export function createPlatformServices(opts = {}) {
  const storage = opts.storage ?? createDefaultStorage();
  const { documents, graph, vectors } = storage;
  const bus = opts.bus ?? null;
  const registry = opts.registry ?? null;

  const rules = new RuleService({ documents, graph, seed: opts.seedPlatform !== false });
  const decisions = new DecisionService({ documents, graph, vectors });
  const capabilities = new CapabilityService({ documents, graph });
  const patterns = new PatternService({ documents, graph, vectors });
  const dna = new DnaService({ documents, graph, bus });
  const knowledge = new KnowledgeService({
    documents, graph, vectors, patterns, decisions, rules,
  });
  const artifacts = registry
    ? new ArtifactQueryService({ registry, graph })
    : null;
  const dependencyGraph = new DependencyGraphService({ graph, artifacts, bus });

  if (opts.seedPlatform !== false) {
    seedPlatformDefaults({ decisions, capabilities, patterns, knowledge });
  }

  return {
    storage,
    dna,
    rules,
    decisions,
    capabilities,
    patterns,
    knowledge,
    artifacts,
    dependencyGraph,
    /** Platform search facade (CTO Priority 3). */
    search: createSearchFacade({ knowledge, decisions, rules, patterns, artifacts, dependencyGraph, vectors }),
  };
}

function seedPlatformDefaults({ decisions, capabilities, patterns, knowledge }) {
  decisions.put({
    id: 'EDR-001',
    status: 'Accepted',
    owner: 'Anaz',
    project: 'platform',
    title: 'Architecture freeze',
    body: 'Architecture freeze v1.2; Policy Engine and System Health sanctioned.',
    related_standards: ['AR-01'],
    introduced_rules: [],
  });
  decisions.put({
    id: 'EDR-002',
    status: 'Accepted',
    owner: 'Anaz',
    project: 'platform',
    title: 'Runtime reference implementation',
    body: 'Dependency-free ESM JS reference for Sprint 1.',
    related_standards: ['TS-09', 'OB-09'],
  });
  decisions.put({
    id: 'EDR-003',
    status: 'Accepted',
    owner: 'Anaz',
    project: 'platform',
    title: 'Pilot before Sprint 2',
    body: 'Pilot task manager validates runtime; revised sprint roadmap adds Artifact Query.',
    related_standards: ['TS-03', 'DO-09'],
    introduced_rules: [],
  });
  decisions.put({
    id: 'EDR-004',
    status: 'Accepted',
    owner: 'Anaz',
    project: 'platform',
    title: 'Platform Infrastructure Sprint',
    body: 'Sprint 2 = Foundation APIs + storage contracts + Dependency Graph §9.6. SDK and Plugin Runtime deferred to v1.6.',
    related_standards: ['AP-05', 'DB-03', 'AR-11', 'DC-08'],
    introduced_rules: ['AR-11', 'DC-08'],
    related_components: ['runtime/src/services', 'runtime/src/storage'],
  });
  decisions.put({
    id: 'EDR-005',
    status: 'Accepted',
    owner: 'Anaz',
    project: 'platform',
    title: 'Platform Extension Framework',
    body: 'v1.6: SDK, extension lifecycle, type-specific SDKs, CLI, 20 first-party skill manifests. Jarvis is an app on Core, not the core.',
    related_standards: ['AP-05', 'CO-05', 'OB-09'],
    related_components: ['packages/sdk', 'packages/cli', 'runtime/src/extensions', 'skills'],
  });
  decisions.put({
    id: 'EDR-006',
    status: 'Accepted',
    owner: 'Anaz',
    project: 'platform',
    title: 'Intelligent Execution Platform',
    body: 'v1.7: scheduler, queue, orchestrator, executor, locks, sessions, memory, cost, metrics, runtime recorder; agents are configuration/jobs not the center.',
    related_standards: ['OB-09', 'OB-10', 'EH-09'],
    related_components: ['runtime/src/iep'],
  });
  decisions.put({
    id: 'EDR-007',
    status: 'Accepted',
    owner: 'Anaz',
    project: 'platform',
    title: 'Product Factory and dual-track operating model',
    body: 'v1.8: platform core complete; Product Factory builders; SaaS/CRM/Marketplace templates; reference projects as regression; KPI is DNA→deployable time.',
    related_standards: ['AR-11', 'DC-08', 'TS-03', 'DO-09'],
    related_components: ['runtime/src/factory', 'templates/products', 'reference-projects'],
  });

  for (const cap of [
    { name: 'Event Bus', status: 'Complete (Sprint 1)', version: '0.1.0', depends_on: [] },
    { name: 'Artifact Registry', status: 'Complete (Sprint 1)', version: '0.1.0', depends_on: ['Event Bus'] },
    { name: 'Execution Engine', status: 'Complete (Sprint 1)', version: '0.1.0', depends_on: ['Event Bus', 'Artifact Registry'] },
    { name: 'Dependency Graph', status: 'Complete (Sprint 2)', version: '0.2.0', depends_on: ['Artifact Registry', 'Decision Registry'] },
    { name: 'Infrastructure Services', status: 'Complete (Sprint 2)', version: '0.2.0', depends_on: ['Execution Engine'] },
    { name: 'Knowledge Engine', status: 'Complete (Sprint 2 API)', version: '0.2.0', depends_on: [] },
    { name: 'Decision Registry', status: 'Complete (Sprint 2 API)', version: '0.2.0', depends_on: [] },
  ]) {
    capabilities.put(cap);
  }

  patterns.put({
    id: 'pattern/productivity/task-manager',
    industry: ['productivity'],
    status: 'validated',
    problem: 'Teams need a minimal task board with assignees and statuses.',
    solution: 'CRUD dashboard modular monolith with tasks, users, reporting modules.',
    standards: ['AR-01', 'DC-05', 'TS-03'],
    capabilities: ['Execution Engine', 'Knowledge Engine'],
    source_project: 'pilot-task-manager',
    last_validated: '2026-07-15',
  });

  knowledge.put({
    id: 'knowledge/mistakes/sm-06-bypass',
    type: 'mistake',
    industry: 'platform',
    status: 'active',
    body: 'gatePassed(improvement) could reach closed without learning-merged check (F-1). Fixed in state machine.',
    tags: ['state-machine', 'SM-06', 'EDR-003'],
    related_standards: ['TS-03'],
    source_project: 'pilot-task-manager',
    last_validated: '2026-07-15',
  });
  knowledge.put({
    id: 'knowledge/playbooks/dna-to-deploy',
    type: 'playbook',
    status: 'active',
    body: 'Project DNA → Execution Engine → Artifacts → Validation → Deployment → Learning → Closed.',
    tags: ['runtime', 'pilot', 'lifecycle'],
    related_standards: ['DO-09', 'AR-11'],
  });
}

function createSearchFacade({ knowledge, decisions, rules, patterns, artifacts, dependencyGraph, vectors }) {
  return {
    /** Natural platform questions → typed service calls. */
    ask(question, params = {}) {
      const q = String(question).toLowerCase();
      if (q.includes('depend') && params.artifactId) {
        return { kind: 'dependents', results: dependencyGraph.answer('dependents', params) };
      }
      if (q.includes('edr') && q.includes('rule') && params.ruleId) {
        return { kind: 'rule-source', results: decisions.introducedRule(params.ruleId) };
      }
      if (q.includes('standard') && params.ruleIds) {
        return { kind: 'standards', results: rules.applicable(params.ruleIds) };
      }
      if (q.includes('break') || q.includes('blast') || q.includes('change')) {
        return { kind: 'blast-radius', results: dependencyGraph.answer('blast-radius', params) };
      }
      if (q.includes('capability') || q.includes('template')) {
        return { kind: 'capability-usage', results: patterns.usingCapability(params.capability) };
      }
      if (params.q || q) {
        return {
          kind: 'semantic',
          results: vectors.search(params.q || question, { limit: params.limit ?? 10 }),
        };
      }
      return { kind: 'knowledge', results: knowledge.retrieve({ intent: 'general', q: question, ...params }) };
    },
    knowledge: (req) => knowledge.retrieve(req),
    artifacts: (filter) => (artifacts ? artifacts.query(filter) : []),
    decisions: (filter) => decisions.query(filter),
    rules: (filter) => rules.query(filter),
    patterns: (filter) => patterns.query(filter),
  };
}

export {
  DnaService,
  RuleService,
  DecisionService,
  CapabilityService,
  PatternService,
  KnowledgeService,
  ArtifactQueryService,
  DependencyGraphService,
};
