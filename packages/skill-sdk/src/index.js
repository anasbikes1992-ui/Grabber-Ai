import { createManifest } from '@grabber/common';

/**
 * Skills: manifest + knowledge refs + patterns + actions + tests metadata.
 * category: platform | language | framework | infrastructure | integration
 */
export function defineSkill(spec) {
  if (!spec.metadata?.category) {
    throw new Error('skill.metadata.category required');
  }
  const manifest = createManifest({
    ...spec,
    type: 'skill',
    capabilities: spec.capabilities ?? ['skill.actions'],
    permissions: spec.permissions ?? [],
    metadata: {
      category: spec.metadata.category,
      knowledge: spec.metadata.knowledge ?? [],
      patterns: spec.metadata.patterns ?? [],
      examples: spec.metadata.examples ?? [],
      tests: spec.metadata.tests ?? [],
      ...spec.metadata,
    },
  });
  const module = {
    async initialize(ctx) {
      const actions = spec.actions ?? {};
      return {
        actions,
        knowledge: manifest.metadata.knowledge,
        patterns: manifest.metadata.patterns,
        ...(spec.initialize ? await spec.initialize(ctx) : {}),
      };
    },
    actions: spec.actions ?? {},
    async health() {
      return { ok: true, errors: [], category: manifest.metadata.category };
    },
  };
  return { manifest, module };
}
