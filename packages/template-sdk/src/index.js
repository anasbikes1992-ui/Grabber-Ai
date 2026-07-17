import { createManifest } from '@grabber/common';

/** Template extension — production templates land v1.8; framework now. */
export function defineTemplate(spec) {
  const manifest = createManifest({
    ...spec,
    type: 'template',
    capabilities: spec.capabilities ?? ['template.scaffold'],
    permissions: spec.permissions ?? ['filesystem'],
    metadata: {
      domain: spec.metadata?.domain ?? 'general',
      dnaDefaults: spec.metadata?.dnaDefaults ?? {},
      skills: spec.metadata?.skills ?? [],
      ...spec.metadata,
    },
  });
  const module = {
    async initialize() {
      return {
        actions: {
          scaffold: async (args = {}) => {
            if (spec.scaffold) return spec.scaffold(args);
            return {
              templateId: manifest.id,
              files: [],
              message: 'scaffold deferred — template body ships with Development Factory (v1.8)',
            };
          },
        },
      };
    },
  };
  return { manifest, module };
}
