// Extension Runtime — unified lifecycle for all extension types (EDR-005).
// Discover → Load → Validate → Initialize → Register → Activate → Monitor → Unload

import {
  EXTENSION_TYPES,
  EXTENSION_LIFECYCLE,
  LIFECYCLE_TRANSITIONS,
  validateManifest,
  validateTypeRules,
  ExtensionError,
  ManifestError,
} from './types.js';

export class ExtensionRuntime {
  #extensions = new Map(); // id -> ExtensionRecord
  #byType = new Map();
  #bus;
  #sdk;
  #monitors = new Map();

  /**
   * @param {{ bus?: { emit: Function }, sdk?: object }} [deps]
   */
  constructor({ bus = null, sdk = null } = {}) {
    this.#bus = bus;
    this.#sdk = sdk;
    for (const t of EXTENSION_TYPES) this.#byType.set(t, new Set());
  }

  list({ type, state } = {}) {
    return [...this.#extensions.values()].filter((e) =>
      (!type || e.manifest.type === type) &&
      (!state || e.state === state));
  }

  get(id) {
    return this.#extensions.get(id) ?? null;
  }

  /** Discover: accept a manifest (from disk, registry, or memory). */
  discover(manifest) {
    const errors = [...validateManifest(manifest), ...validateTypeRules(manifest)];
    if (errors.length) throw new ManifestError(errors);
    if (this.#extensions.has(manifest.id)) {
      throw new ExtensionError(`extension ${manifest.id} already discovered`, {
        code: 'DUPLICATE',
        extensionId: manifest.id,
      });
    }
    const record = {
      manifest: Object.freeze({ ...manifest }),
      state: 'discovered',
      module: null,
      exports: null,
      registered: null,
      health: { ok: true, lastCheck: null, errors: [] },
      history: [{ state: 'discovered', at: now() }],
    };
    this.#extensions.set(manifest.id, record);
    this.#byType.get(manifest.type).add(manifest.id);
    this.#emit('extension.discovered', manifest.id, { type: manifest.type });
    return this.#public(record);
  }

  /** Load: attach implementation module (plain object or factory). */
  load(id, moduleOrFactory) {
    const rec = this.#must(id);
    this.#transition(rec, 'loaded');
    rec.module = typeof moduleOrFactory === 'function'
      ? { create: moduleOrFactory }
      : (moduleOrFactory ?? {});
    this.#emit('extension.loaded', id);
    return this.#public(rec);
  }

  /** Validate: re-check manifest + optional module.validate. */
  async validate(id) {
    const rec = this.#must(id);
    this.#assertState(rec, 'loaded');
    const errors = [
      ...validateManifest(rec.manifest),
      ...validateTypeRules(rec.manifest),
    ];
    if (typeof rec.module?.validate === 'function') {
      const more = await rec.module.validate(rec.manifest) ?? [];
      errors.push(...more);
    }
    // Dependency presence (soft: warn-as-error only if dependency registered and not active)
    for (const dep of rec.manifest.dependencies ?? []) {
      const d = this.#extensions.get(dep);
      if (d && d.state === 'unloaded') {
        errors.push(`dependency ${dep} is unloaded`);
      }
    }
    if (errors.length) throw new ManifestError(errors);
    this.#transition(rec, 'validated');
    this.#emit('extension.validated', id);
    return this.#public(rec);
  }

  /** Initialize: call module.initialize(ctx). */
  async initialize(id, ctx = {}) {
    const rec = this.#must(id);
    this.#assertState(rec, 'validated');
    const context = {
      sdk: this.#sdk,
      manifest: rec.manifest,
      ...ctx,
    };
    if (typeof rec.module?.initialize === 'function') {
      rec.exports = await rec.module.initialize(context);
    } else if (typeof rec.module?.create === 'function') {
      rec.exports = await rec.module.create(context);
    } else {
      rec.exports = rec.module;
    }
    this.#transition(rec, 'initialized');
    this.#emit('extension.initialized', id);
    return this.#public(rec);
  }

  /** Register: publish hooks/capabilities into host registries. */
  async register(id, host = {}) {
    const rec = this.#must(id);
    this.#assertState(rec, 'initialized');
    const registration = {
      id: rec.manifest.id,
      type: rec.manifest.type,
      capabilities: rec.manifest.capabilities,
      hooks: rec.manifest.hooks,
      exports: rec.exports,
    };
    if (typeof rec.module?.register === 'function') {
      registration.host = await rec.module.register({
        ...registration,
        host,
        sdk: this.#sdk,
      });
    }
    if (typeof host.onRegister === 'function') {
      await host.onRegister(registration);
    }
    rec.registered = registration;
    this.#transition(rec, 'registered');
    this.#emit('extension.registered', id, { type: rec.manifest.type });
    return this.#public(rec);
  }

  /** Activate: extension may accept traffic / run actions. */
  async activate(id) {
    const rec = this.#must(id);
    this.#assertState(rec, 'registered');
    if (typeof rec.module?.activate === 'function') {
      await rec.module.activate({ sdk: this.#sdk, manifest: rec.manifest, exports: rec.exports });
    }
    this.#transition(rec, 'active');
    this.#emit('extension.activated', id);
    return this.#public(rec);
  }

  /** Monitor: optional health probe. */
  async monitor(id) {
    const rec = this.#must(id);
    if (rec.state !== 'active' && rec.state !== 'monitored') {
      throw new ExtensionError(`cannot monitor ${id} in state ${rec.state}`, {
        code: 'INVALID_STATE',
        extensionId: id,
      });
    }
    let health = { ok: true, errors: [] };
    if (typeof rec.module?.health === 'function') {
      health = await rec.module.health() ?? health;
    }
    rec.health = { ...health, lastCheck: now() };
    if (rec.state === 'active') this.#transition(rec, 'monitored');
    this.#emit('extension.monitored', id, { ok: rec.health.ok });
    return this.#public(rec);
  }

  /** Unload: reverse of activate; remove from active set. */
  async unload(id) {
    const rec = this.#must(id);
    if (rec.state === 'unloaded') return this.#public(rec);
    if (typeof rec.module?.unload === 'function') {
      await rec.module.unload({ sdk: this.#sdk, manifest: rec.manifest });
    }
    this.#monitors.delete(id);
    rec.state = 'unloaded';
    rec.history.push({ state: 'unloaded', at: now() });
    this.#emit('extension.unloaded', id);
    return this.#public(rec);
  }

  /**
   * Full pipeline: discover → … → activate (and optional monitor).
   * @param {object} manifest
   * @param {object|Function} moduleOrFactory
   * @param {{ host?: object, ctx?: object, monitor?: boolean }} [opts]
   */
  async install(manifest, moduleOrFactory = {}, opts = {}) {
    this.discover(manifest);
    this.load(manifest.id, moduleOrFactory);
    await this.validate(manifest.id);
    await this.initialize(manifest.id, opts.ctx ?? {});
    await this.register(manifest.id, opts.host ?? {});
    await this.activate(manifest.id);
    if (opts.monitor !== false) await this.monitor(manifest.id);
    return this.get(manifest.id);
  }

  /** Invoke a skill/plugin action if exported. */
  async invoke(id, action, args = {}) {
    const rec = this.#must(id);
    if (rec.state !== 'active' && rec.state !== 'monitored') {
      throw new ExtensionError(`extension ${id} is not active`, {
        code: 'NOT_ACTIVE',
        extensionId: id,
      });
    }
    const actions = rec.exports?.actions ?? rec.module?.actions ?? {};
    const fn = actions[action];
    if (typeof fn !== 'function') {
      throw new ExtensionError(`action "${action}" not found on ${id}`, {
        code: 'UNKNOWN_ACTION',
        extensionId: id,
      });
    }
    return fn(args, { sdk: this.#sdk, manifest: rec.manifest });
  }

  #must(id) {
    const rec = this.#extensions.get(id);
    if (!rec) throw new ExtensionError(`unknown extension ${id}`, { code: 'NOT_FOUND', extensionId: id });
    return rec;
  }

  #assertState(rec, expected) {
    if (rec.state !== expected) {
      throw new ExtensionError(
        `extension ${rec.manifest.id} must be ${expected}, is ${rec.state}`,
        { code: 'INVALID_STATE', extensionId: rec.manifest.id },
      );
    }
  }

  #transition(rec, next) {
    const allowed = LIFECYCLE_TRANSITIONS[rec.state] ?? [];
    if (!allowed.includes(next) && next !== rec.state) {
      // Allow forward pipeline only via assertState; unloaded is explicit.
      if (next !== 'unloaded') {
        // discovered→loaded etc. are sequential — enforce allowed set
        if (!allowed.includes(next)) {
          throw new ExtensionError(
            `invalid lifecycle ${rec.state} → ${next}`,
            { code: 'INVALID_TRANSITION', extensionId: rec.manifest.id },
          );
        }
      }
    }
    rec.state = next;
    rec.history.push({ state: next, at: now() });
  }

  #public(rec) {
    return {
      id: rec.manifest.id,
      type: rec.manifest.type,
      version: rec.manifest.version,
      state: rec.state,
      manifest: rec.manifest,
      health: rec.health,
      capabilities: rec.manifest.capabilities,
    };
  }

  #emit(type, id, payload = {}) {
    if (!this.#bus?.emit) return;
    try {
      this.#bus.emit({
        type: 'governance.policy_triggered', // reuse catalogue; payload carries extension event
        project: 'platform',
        stage: '',
        subject: id,
        actor: 'extension-runtime',
        payload: { extensionEvent: type, ...payload },
      });
    } catch {
      // Event catalogue may not include extension.* yet — silent in bus-less mode
    }
  }
}

function now() {
  return new Date().toISOString();
}

export { EXTENSION_TYPES, EXTENSION_LIFECYCLE };
