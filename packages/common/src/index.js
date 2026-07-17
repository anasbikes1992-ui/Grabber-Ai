// @grabber/common — shared contracts for the Platform Extension Framework (EDR-005).

export const EXTENSION_TYPES = Object.freeze([
  'plugin',
  'connector',
  'skill',
  'workflow',
  'template',
  'knowledge-pack',
  'agent',
  'policy',
  'validator',
]);

export const EXTENSION_LIFECYCLE = Object.freeze([
  'discovered',
  'loaded',
  'validated',
  'initialized',
  'registered',
  'active',
  'monitored',
  'unloaded',
]);

export const LIFECYCLE_TRANSITIONS = Object.freeze({
  discovered: ['loaded', 'unloaded'],
  loaded: ['validated', 'unloaded'],
  validated: ['initialized', 'unloaded'],
  initialized: ['registered', 'unloaded'],
  registered: ['active', 'unloaded'],
  active: ['monitored', 'unloaded'],
  monitored: ['active', 'unloaded'],
  unloaded: [],
});

/** Minimal manifest schema shared by all extension types. */
export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') return ['manifest must be an object'];
  if (!manifest.id || typeof manifest.id !== 'string') errors.push('manifest.id required');
  if (!manifest.version || typeof manifest.version !== 'string') errors.push('manifest.version required');
  if (!EXTENSION_TYPES.includes(manifest.type)) {
    errors.push(`manifest.type must be one of: ${EXTENSION_TYPES.join(', ')}`);
  }
  if (!Array.isArray(manifest.capabilities)) errors.push('manifest.capabilities must be an array');
  if (!Array.isArray(manifest.permissions)) errors.push('manifest.permissions must be an array');
  if (manifest.hooks !== undefined && !Array.isArray(manifest.hooks)) {
    errors.push('manifest.hooks must be an array when present');
  }
  if (manifest.dependencies !== undefined && !Array.isArray(manifest.dependencies)) {
    errors.push('manifest.dependencies must be an array when present');
  }
  return errors;
}

export function createManifest(partial) {
  const manifest = {
    id: partial.id,
    version: partial.version ?? '0.1.0',
    type: partial.type,
    displayName: partial.displayName ?? partial.id,
    description: partial.description ?? '',
    capabilities: partial.capabilities ?? [],
    permissions: partial.permissions ?? [],
    hooks: partial.hooks ?? [],
    dependencies: partial.dependencies ?? [],
    entry: partial.entry ?? null,
    metadata: partial.metadata ?? {},
  };
  const errors = validateManifest(manifest);
  if (errors.length) throw new ManifestError(errors);
  return Object.freeze(manifest);
}

export class ManifestError extends Error {
  constructor(errors) {
    super(Array.isArray(errors) ? errors.join('; ') : String(errors));
    this.name = 'ManifestError';
    this.errors = Array.isArray(errors) ? errors : [String(errors)];
  }
}

export class ExtensionError extends Error {
  constructor(message, { code = 'EXTENSION_ERROR', extensionId = null } = {}) {
    super(message);
    this.name = 'ExtensionError';
    this.code = code;
    this.extensionId = extensionId;
  }
}

export class SdkError extends Error {
  constructor(message, { code = 'SDK_ERROR', cause = null } = {}) {
    super(message);
    this.name = 'SdkError';
    this.code = code;
    this.cause = cause;
  }
}
