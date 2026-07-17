import { createManifest } from '@grabber/common';

/** Build a plugin manifest + default module shell. */
export function definePlugin(spec) {
  const manifest = createManifest({
    ...spec,
    type: 'plugin',
    capabilities: spec.capabilities ?? ['plugin'],
    permissions: spec.permissions ?? [],
  });
  const module = {
    async initialize(ctx) {
      return spec.initialize ? spec.initialize(ctx) : { actions: spec.actions ?? {} };
    },
    async register(reg) {
      return spec.register ? spec.register(reg) : reg;
    },
    async activate(ctx) {
      return spec.activate?.(ctx);
    },
    async health() {
      return spec.health ? spec.health() : { ok: true, errors: [] };
    },
    async unload(ctx) {
      return spec.unload?.(ctx);
    },
    actions: spec.actions ?? {},
  };
  return { manifest, module };
}
