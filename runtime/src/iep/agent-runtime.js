// Agent Runtime — agents are configuration loaded by IEP (EDR-006).
// Lifecycle: initialize → prepare → buildContext → execute → validate → publish → learn → shutdown

export const AGENT_LIFECYCLE = Object.freeze([
  'initialize',
  'prepare',
  'buildContext',
  'execute',
  'validate',
  'publish',
  'learn',
  'shutdown',
]);

/**
 * Normalize agent config (YAML/JSON shape).
 * @param {object} config
 */
export function normalizeAgentConfig(config) {
  if (!config?.id) throw new Error('agent.id required');
  if (!config?.role) throw new Error('agent.role required');
  return Object.freeze({
    id: config.id,
    role: config.role,
    layer: config.layer ?? 'thinking',
    permissions: Object.freeze([...(config.permissions ?? [])]),
    skills: Object.freeze([...(config.skills ?? [])]),
    connectors: Object.freeze([...(config.connectors ?? [])]),
    workflows: Object.freeze([...(config.workflows ?? [])]),
    policies: Object.freeze([...(config.policies ?? [])]),
    memory: Object.freeze({ ...(config.memory ?? { layers: ['working', 'project'] }) }),
    budget: Object.freeze({
      maxTokens: config.budget?.maxTokens ?? 100_000,
      maxCost: config.budget?.maxCost ?? 1.0,
      model: config.budget?.model ?? 'stub',
      ...(config.budget ?? {}),
    }),
    models: Object.freeze([...(config.models ?? [config.budget?.model ?? 'stub'])]),
    validators: Object.freeze([...(config.validators ?? [])]),
    metadata: Object.freeze({ ...(config.metadata ?? {}) }),
  });
}

export class AgentRuntime {
  #agents = new Map(); // id -> { config, impl, state }
  #iep;

  /**
   * @param {{ memory?: import('./memory.js').MemoryService, cost?: import('./cost.js').CostEngine }} [iep]
   */
  constructor(iep = {}) {
    this.#iep = iep;
  }

  /**
   * Register agent configuration + optional lifecycle implementation.
   * @param {object} config
   * @param {Partial<Record<typeof AGENT_LIFECYCLE[number], Function>>} [impl]
   */
  register(config, impl = {}) {
    const normalized = normalizeAgentConfig(config);
    this.#agents.set(normalized.id, {
      config: normalized,
      impl: { ...impl },
      state: 'registered',
    });
    return normalized;
  }

  get(id) {
    const a = this.#agents.get(id);
    return a ? { config: a.config, state: a.state } : null;
  }

  list() {
    return [...this.#agents.values()].map((a) => ({
      id: a.config.id,
      role: a.config.role,
      state: a.state,
    }));
  }

  /**
   * Run full agent lifecycle for a task context.
   * @param {string} agentId
   * @param {{ bundle?: object, projectId?: string, input?: object }} task
   */
  async run(agentId, task = {}) {
    const agent = this.#agents.get(agentId);
    if (!agent) throw new Error(`unknown agent ${agentId}`);

    let state = {
      config: agent.config,
      task,
      bundle: task.bundle ?? null,
      output: null,
      validation: null,
      published: null,
      learned: null,
      memory: null,
    };

    agent.state = 'running';
    try {
      for (const step of AGENT_LIFECYCLE) {
        state = await this.#step(agent, step, state);
      }
      agent.state = 'idle';
      return {
        agentId,
        role: agent.config.role,
        output: state.output,
        validation: state.validation,
        published: state.published,
        learned: state.learned,
        tokens: state.tokens ?? 0,
        modelsUsed: agent.config.models,
      };
    } catch (err) {
      agent.state = 'error';
      // best-effort shutdown
      try {
        await this.#step(agent, 'shutdown', { ...state, error: err });
      } catch { /* ignore */ }
      throw err;
    }
  }

  /** Job handler for scheduler type `agent.run`. */
  createJobHandler() {
    return async (job, ctx) => {
      const agentId = job.agentId ?? job.payload?.agentId;
      if (!agentId) throw new Error('agent.run requires agentId');
      const result = await this.run(agentId, {
        projectId: job.projectId,
        bundle: job.payload?.bundle,
        input: job.payload?.input,
        executionId: ctx?.executionId,
      });
      return result;
    };
  }

  async #step(agent, step, state) {
    const fn = agent.impl[step];
    const config = agent.config;

    // Built-in defaults when impl omits a step
    if (step === 'initialize' && !fn) {
      return { ...state, initialized: true };
    }
    if (step === 'prepare' && !fn) {
      return {
        ...state,
        prepared: {
          permissions: config.permissions,
          skills: config.skills,
          budget: config.budget,
        },
      };
    }
    if (step === 'buildContext' && !fn) {
      const memory = this.#iep.memory?.snapshot({
        projectId: state.task.projectId,
        actor: config.id,
      }) ?? null;
      // Enforce budget envelope on context size (token estimate = JSON length/4)
      const bundle = state.bundle ?? state.task.input ?? {};
      const approxTokens = Math.ceil(JSON.stringify(bundle).length / 4);
      if (approxTokens > config.budget.maxTokens) {
        throw new Error(`context exceeds agent budget maxTokens=${config.budget.maxTokens}`);
      }
      return { ...state, memory, bundle, tokens: approxTokens };
    }
    if (step === 'execute' && !fn) {
      throw new Error(`agent ${config.id} has no execute implementation`);
    }
    if (step === 'validate' && !fn) {
      return {
        ...state,
        validation: { passed: true, score: 100, notes: 'default-pass (no validator)' },
      };
    }
    if (step === 'publish' && !fn) {
      return { ...state, published: state.output };
    }
    if (step === 'learn' && !fn) {
      if (this.#iep.memory && state.task.projectId) {
        this.#iep.memory.put('project', {
          key: `agent:${config.id}:last`,
          scope: state.task.projectId,
          value: { output: state.output, at: new Date().toISOString() },
        });
      }
      return { ...state, learned: true };
    }
    if (step === 'shutdown' && !fn) {
      return { ...state, shutdown: true };
    }

    const patch = await fn(state);
    return { ...state, ...(patch ?? {}) };
  }
}
