import { createManifest } from '@grabber/common';

export function defineWorkflow(spec) {
  const stages = spec.stages ?? spec.tasks ?? [];
  const manifest = createManifest({
    ...spec,
    type: 'workflow',
    capabilities: spec.capabilities ?? ['workflow'],
    permissions: spec.permissions ?? [],
    metadata: { stages, ...spec.metadata },
  });
  const module = {
    async initialize() {
      return {
        stages,
        actions: {
          describe: () => ({ id: manifest.id, stages }),
        },
      };
    },
  };
  return { manifest, module };
}
