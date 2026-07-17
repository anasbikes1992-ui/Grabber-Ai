import { createManifest, ExtensionError } from '@grabber/common';

const THIN = new Set(['auth', 'transport', 'subscribe', 'transfer', 'webhooks', 'read', 'write']);

/**
 * Connectors are intentionally minimal: auth, transport, events, transfer, webhooks.
 * No business logic.
 */
export function defineConnector(spec) {
  const capabilities = spec.capabilities ?? ['auth', 'transport'];
  for (const c of capabilities) {
    if (!THIN.has(c) && !String(c).startsWith('connector.')) {
      throw new ExtensionError(
        `connector may not declare business capability "${c}"`,
        { code: 'CONNECTOR_NOT_THIN' },
      );
    }
  }
  const manifest = createManifest({
    ...spec,
    type: 'connector',
    capabilities,
    permissions: spec.permissions ?? ['network', 'secrets'],
  });
  const module = {
    async initialize(ctx) {
      const client = {
        authenticate: spec.authenticate ?? (async () => ({ ok: true })),
        request: spec.request ?? (async () => { throw new ExtensionError('request not implemented'); }),
        subscribe: spec.subscribe ?? (async () => ({ unsubscribe: async () => {} })),
        transfer: spec.transfer ?? null,
        webhooks: spec.webhooks ?? null,
      };
      return { client, actions: {
        authenticate: (_a, c) => client.authenticate(c),
        request: (args) => client.request(args),
      } };
    },
    async health() {
      return spec.health ? spec.health() : { ok: true, errors: [] };
    },
  };
  return { manifest, module };
}
