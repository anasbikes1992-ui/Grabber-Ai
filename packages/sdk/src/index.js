// @grabber/sdk — public contract for Grabber AI Studio Core (EDR-005).
// Extensions and CLI import this package only — never runtime/src/* private modules.

import { SdkError } from '@grabber/common';
import { createPlatformServices } from '../../../runtime/src/services/index.js';
import { EventBus } from '../../../runtime/src/events/bus.js';
import { ArtifactRegistry } from '../../../runtime/src/artifacts/registry.js';
import { ProjectStateMachine } from '../../../runtime/src/state-machine/machine.js';
import { ValidationRuntime } from '../../../runtime/src/validation/runtime.js';
import { PolicyEngine } from '../../../runtime/src/policy/engine.js';
import { Telemetry } from '../../../runtime/src/telemetry/recorder.js';
import { SystemHealth } from '../../../runtime/src/health/monitor.js';
import { ContextEngine } from '../../../runtime/src/context/engine.js';
import { createIEP } from '../../../runtime/src/iep/index.js';
import { createProductFactory } from '../../../runtime/src/factory/index.js';

export { SdkError };

/**
 * Create a Grabber client bound to an in-process Core runtime.
 * Later: HTTP/gRPC transport can replace the local adapter without changing callers.
 */
export function createGrabberClient(options = {}) {
  const core = options.core ?? bootstrapLocalCore(options);
  return new GrabberClient(core);
}

function bootstrapLocalCore({ agentLayers = {}, seedPlatform = true } = {}) {
  const bus = new EventBus();
  const machine = new ProjectStateMachine(bus);
  const registry = new ArtifactRegistry(bus, {
    stageOf: (p) => machine.stageOf(p),
    layerOf: (agent) => agentLayers[agent] ?? 'thinking',
  });
  const context = new ContextEngine({ standardsVersion: 'stds-1.0.0' });
  const validation = new ValidationRuntime(bus, registry);
  const policy = new PolicyEngine(bus);
  const telemetry = new Telemetry();
  const health = new SystemHealth({ bus, telemetry, contextEngine: context });
  const services = createPlatformServices({ bus, registry, seedPlatform });
  const iep = createIEP({ bus });
  const factory = createProductFactory({ iep, bus });

  return {
    bus,
    machine,
    registry,
    context,
    validation,
    policy,
    telemetry,
    health,
    services,
    iep,
    factory,
  };
}

export class GrabberClient {
  #core;

  constructor(core) {
    if (!core?.services) throw new SdkError('core.services required', { code: 'INVALID_CORE' });
    this.#core = core;
    this.project = new ProjectClient(core);
    this.artifact = new ArtifactClient(core);
    this.knowledge = new KnowledgeClient(core);
    this.decision = new DecisionClient(core);
    this.rule = new RuleClient(core);
    this.dna = new DNAClient(core);
    this.validation = new ValidationClient(core);
    this.policy = new PolicyClient(core);
    this.telemetry = new TelemetryClient(core);
    this.search = new SearchClient(core);
    this.capability = new CapabilityClient(core);
    this.pattern = new PatternClient(core);
    this.graph = new GraphClient(core);
    this.runtime = new RuntimeClient(core);
    this.iep = new IepClient(core);
    this.product = new ProductClient(core);
  }

  /** Escape hatch for Core-hosted runtimes only — extensions must not use this. */
  get _core() {
    return this.#core;
  }
}

class ProjectClient {
  #core;
  constructor(core) { this.#core = core; }

  create({ id, dna }) {
    const rec = this.#core.services.dna.put({ projectId: id, dna, approved: false });
    this.#core.machine.createProject({ id, dna: rec.content });
    return { id, stage: this.#core.machine.stageOf(id), dnaVersion: rec.version };
  }

  stage(id) {
    return this.#core.machine.stageOf(id);
  }

  condition(id) {
    return this.#core.machine.conditionOf(id);
  }

  get(id) {
    return {
      id,
      stage: this.#core.machine.stageOf(id),
      condition: this.#core.machine.conditionOf(id),
      dna: this.#core.services.dna.get(id),
    };
  }
}

class ArtifactClient {
  #core;
  constructor(core) { this.#core = core; }

  get(id) {
    return this.#core.services.artifacts.get(id);
  }

  query(filter = {}) {
    return this.#core.services.artifacts.query(filter);
  }

  dependents(id) {
    return this.#core.services.artifacts.dependents(id);
  }

  provenance(id) {
    return this.#core.services.artifacts.provenance(id);
  }
}

class KnowledgeClient {
  #core;
  constructor(core) { this.#core = core; }

  retrieve(req) {
    return this.#core.services.knowledge.retrieve(req);
  }

  put(entry) {
    return this.#core.services.knowledge.put(entry);
  }
}

class DecisionClient {
  #core;
  constructor(core) { this.#core = core; }

  get(id) { return this.#core.services.decisions.get(id); }
  query(filter) { return this.#core.services.decisions.query(filter); }
  put(edr) { return this.#core.services.decisions.put(edr); }
  introducedRule(ruleId) { return this.#core.services.decisions.introducedRule(ruleId); }
}

class RuleClient {
  #core;
  constructor(core) { this.#core = core; }

  get(id) { return this.#core.services.rules.get(id); }
  query(filter) { return this.#core.services.rules.query(filter); }
  applicable(ids) { return this.#core.services.rules.applicable(ids); }
}

class DNAClient {
  #core;
  constructor(core) { this.#core = core; }

  put(args) { return this.#core.services.dna.put(args); }
  get(projectId, version) { return this.#core.services.dna.get(projectId, version); }
  section(projectId, path) { return this.#core.services.dna.section(projectId, path); }
  listVersions(projectId) { return this.#core.services.dna.listVersions(projectId); }
  approve(projectId, version, actor) { return this.#core.services.dna.approve(projectId, version, actor); }
}

class ValidationClient {
  #core;
  constructor(core) { this.#core = core; }

  /** Expose registered validation runtime for hosts; scoring stays in Core. */
  get runtime() { return this.#core.validation; }
}

class PolicyClient {
  #core;
  constructor(core) { this.#core = core; }

  isBlocked(projectId, action) {
    return this.#core.policy.isBlocked?.(projectId, action) ?? null;
  }

  get engine() { return this.#core.policy; }
}

class TelemetryClient {
  #core;
  constructor(core) { this.#core = core; }

  get recorder() { return this.#core.telemetry; }
  health() { return this.#core.health.snapshot?.() ?? this.#core.health; }
}

class SearchClient {
  #core;
  constructor(core) { this.#core = core; }

  ask(question, params) { return this.#core.services.search.ask(question, params); }
  knowledge(req) { return this.#core.services.search.knowledge(req); }
  artifacts(filter) { return this.#core.services.search.artifacts(filter); }
}

class CapabilityClient {
  #core;
  constructor(core) { this.#core = core; }

  get(name) { return this.#core.services.capabilities.get(name); }
  query(filter) { return this.#core.services.capabilities.query(filter); }
  put(cap) { return this.#core.services.capabilities.put(cap); }
}

class PatternClient {
  #core;
  constructor(core) { this.#core = core; }

  get(id) { return this.#core.services.patterns.get(id); }
  query(filter) { return this.#core.services.patterns.query(filter); }
  usingCapability(cap) { return this.#core.services.patterns.usingCapability(cap); }
}

class GraphClient {
  #core;
  constructor(core) { this.#core = core; }

  impact(args) { return this.#core.services.dependencyGraph.impact(args); }
  orderTasks(tasks) { return this.#core.services.dependencyGraph.orderTasks(tasks); }
  answer(kind, params) { return this.#core.services.dependencyGraph.answer(kind, params); }
  staleArtifacts(projectId) { return this.#core.services.dependencyGraph.staleArtifacts(projectId); }
}

class RuntimeClient {
  #core;
  constructor(core) { this.#core = core; }

  status() {
    return {
      eventDepth: this.#core.bus.depth,
      capabilities: this.#core.services.capabilities.query({}).map((c) => ({
        name: c.name,
        status: c.status,
        version: c.version,
      })),
      health: typeof this.#core.health.snapshot === 'function'
        ? this.#core.health.snapshot()
        : { ok: true },
      iep: this.#core.iep ? {
        queueDepth: this.#core.iep.queue.depth,
        kpis: this.#core.iep.kpis(),
      } : null,
    };
  }

  get bus() { return this.#core.bus; }
}

class IepClient {
  #core;
  constructor(core) { this.#core = core; }

  get stack() { return this.#core.iep; }
  schedule(jobs) { return this.#core.iep.scheduler.schedule(jobs); }
  scheduleAgent(args) { return this.#core.iep.scheduler.scheduleAgent(args); }
  async runUntilIdle(opts) { return this.#core.iep.orchestrator.runUntilIdle(opts); }
  replay(executionId) { return this.#core.iep.recorder.replay(executionId); }
  kpis(filter) { return this.#core.iep.kpis(filter); }
  registerAgent(config, impl) { return this.#core.iep.agents.register(config, impl); }
}

class ProductClient {
  #core;
  constructor(core) { this.#core = core; }

  plan(dna) { return this.#core.factory.plan(dna); }
  build(dna, opts) { return this.#core.factory.build(dna, opts); }
  validate(buildResult) { return this.#core.factory.validate(buildResult); }
  deploy(buildResult) { return this.#core.factory.deploy(buildResult); }
  regenerate(dna, opts) { return this.#core.factory.regenerate(dna, opts); }
}
