// Extension type catalogue (EDR-005). Re-export common + type-specific rules.
export {
  EXTENSION_TYPES,
  EXTENSION_LIFECYCLE,
  LIFECYCLE_TRANSITIONS,
  validateManifest,
  createManifest,
  ManifestError,
  ExtensionError,
} from '../../../packages/common/src/index.js';

/** Type-specific extra validation (connectors must stay thin, etc.). */
export function validateTypeRules(manifest) {
  const errors = [];
  if (manifest.type === 'connector') {
    const allowed = new Set(['auth', 'transport', 'subscribe', 'transfer', 'webhooks', 'read', 'write']);
    for (const c of manifest.capabilities ?? []) {
      if (!allowed.has(c) && !String(c).startsWith('connector.')) {
        errors.push(`connector capability "${c}" not allowed — keep connectors thin (auth/transport/subscribe/transfer/webhooks)`);
      }
    }
  }
  if (manifest.type === 'skill') {
    if (!manifest.metadata?.category) {
      errors.push('skill.metadata.category required (platform|language|framework|infrastructure|integration)');
    }
  }
  if (manifest.type === 'agent') {
    if (!manifest.metadata?.role) {
      errors.push('agent.metadata.role required');
    }
  }
  return errors;
}
