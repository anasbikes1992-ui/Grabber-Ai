import { createManifest } from '@grabber/common';

/**
 * Agent SDK — configuration + uniform lifecycle (EDR-006).
 * Agents are replaceable participants, not the center of the platform.
 */
export const AGENT_STEPS = Object.freeze([
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
 * @param {object} spec
 * @param {string} spec.id
 * @param {object} spec.metadata — must include role
 * @param {Function} [spec.initialize]
 * @param {Function} [spec.prepare]
 * @param {Function} [spec.buildContext]
 * @param {Function} [spec.execute]
 * @param {Function} [spec.validate]
 * @param {Function} [spec.publish]
 * @param {Function} [spec.learn]
 * @param {Function} [spec.shutdown]
 */
export function defineAgent(spec) {
  if (!spec.metadata?.role) throw new Error('agent.metadata.role required');
  const manifest = createManifest({
    ...spec,
    type: 'agent',
    capabilities: spec.capabilities ?? ['agent.execute'],
    permissions: spec.permissions ?? [],
    metadata: {
      role: spec.metadata.role,
      layer: spec.metadata.layer ?? 'thinking',
      skills: spec.metadata.skills ?? [],
      connectors: spec.metadata.connectors ?? [],
      budget: spec.metadata.budget ?? {},
      models: spec.metadata.models ?? ['stub'],
      validators: spec.metadata.validators ?? [],
      ...spec.metadata,
    },
  });

  /** Config document shape for AgentRuntime.register */
  const config = {
    id: manifest.id,
    role: manifest.metadata.role,
    layer: manifest.metadata.layer,
    permissions: manifest.permissions,
    skills: manifest.metadata.skills,
    connectors: manifest.metadata.connectors,
    workflows: manifest.metadata.workflows ?? [],
    policies: manifest.metadata.policies ?? [],
    memory: manifest.metadata.memory ?? { layers: ['working', 'project'] },
    budget: {
      maxTokens: manifest.metadata.budget?.maxTokens ?? 100_000,
      maxCost: manifest.metadata.budget?.maxCost ?? 1.0,
      model: manifest.metadata.models?.[0] ?? 'stub',
      ...manifest.metadata.budget,
    },
    models: manifest.metadata.models,
    validators: manifest.metadata.validators,
    metadata: manifest.metadata,
  };

  const impl = {};
  for (const step of AGENT_STEPS) {
    if (typeof spec[step] === 'function') impl[step] = spec[step];
  }

  const module = {
    async initialize(ctx) {
      const agent = {
        config,
        role: config.role,
        layer: config.layer,
        async run(bundle) {
          let state = { bundle, ctx, config, task: { bundle } };
          for (const step of AGENT_STEPS) {
            const fn = impl[step];
            if (typeof fn === 'function') {
              state = { ...state, ...(await fn(state)) };
            } else if (step === 'execute') {
              throw new Error(`agent ${config.id} missing execute()`);
            }
          }
          return state.output ?? state;
        },
        asExecutor() {
          return async (bundle) => {
            const result = await agent.run(bundle);
            return result.output ?? result;
          };
        },
      };
      return {
        agent,
        config,
        impl,
        actions: { run: (args) => agent.run(args.bundle) },
      };
    },
  };

  return { manifest, module, config, impl };
}

/** Build AgentRuntime-ready registration from defineAgent result or raw config. */
export function toAgentRegistration(definedOrConfig, impl = {}) {
  if (definedOrConfig.config && definedOrConfig.impl) {
    return {
      config: definedOrConfig.config,
      impl: { ...definedOrConfig.impl, ...impl },
    };
  }
  return { config: definedOrConfig, impl };
}
