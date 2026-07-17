// Platform Extension Framework tests (EDR-005).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ExtensionRuntime, createManifest, ManifestError } from '../src/extensions/index.js';
import { defineSkill } from '../../packages/skill-sdk/src/index.js';
import { defineConnector } from '../../packages/connector-sdk/src/index.js';
import { definePlugin } from '../../packages/plugin-sdk/src/index.js';
import { defineAgent, AGENT_STEPS } from '../../packages/agent-sdk/src/index.js';
import { createGrabberClient } from '../../packages/sdk/src/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('extension lifecycle: discover → activate → monitor → unload', async () => {
  const rt = new ExtensionRuntime();
  const { manifest, module } = definePlugin({
    id: 'plugin.demo',
    version: '1.0.0',
    capabilities: ['plugin.demo'],
    permissions: [],
    actions: { ping: async () => ({ pong: true }) },
  });

  await rt.install(manifest, module);
  const rec = rt.get('plugin.demo');
  assert.ok(rec.state === 'monitored' || rec.state === 'active');
  const result = await rt.invoke('plugin.demo', 'ping');
  assert.equal(result.pong, true);
  await rt.unload('plugin.demo');
  assert.equal(rt.get('plugin.demo').state, 'unloaded');
});

test('connector rejects business capabilities (thin rule)', () => {
  assert.throws(() => defineConnector({
    id: 'connector.bad',
    version: '1.0.0',
    capabilities: ['pricing-engine'],
  }));
});

test('connector installs with auth + transport only', async () => {
  const rt = new ExtensionRuntime();
  const { manifest, module } = defineConnector({
    id: 'connector.httpbin',
    version: '0.1.0',
    capabilities: ['auth', 'transport'],
    authenticate: async () => ({ token: 't' }),
    request: async ({ path }) => ({ status: 200, path }),
  });
  await rt.install(manifest, module);
  const res = await rt.invoke('connector.httpbin', 'request', { path: '/ok' });
  assert.equal(res.status, 200);
});

test('skill installs from first-party catalog sample', async () => {
  const client = createGrabberClient();
  const rt = new ExtensionRuntime({ sdk: client });
  const manifest = JSON.parse(
    readFileSync(join(root, 'skills/platform/git/manifest.json'), 'utf8'),
  );
  const { module } = defineSkill({
    ...manifest,
    actions: {
      status: async () => ({ ok: true, clean: true }),
    },
  });
  await rt.install(manifest, module);
  const out = await rt.invoke('skill.platform.git', 'status');
  assert.equal(out.ok, true);
});

test('agent-sdk exposes lifecycle steps', () => {
  assert.deepEqual(AGENT_STEPS, [
    'initialize', 'prepare', 'buildContext', 'execute', 'validate', 'publish', 'learn', 'shutdown',
  ]);
  const { manifest, module, config } = defineAgent({
    id: 'agent.ba',
    version: '0.1.0',
    metadata: { role: 'business-analyst', layer: 'thinking' },
    execute: async ({ bundle }) => ({ output: { type: 'document.prd', content: bundle } }),
  });
  assert.equal(manifest.type, 'agent');
  assert.ok(module.initialize);
  assert.equal(config.role, 'business-analyst');
});

test('invalid manifest fails validation', () => {
  assert.throws(() => createManifest({ id: 'x', type: 'not-a-type' }), ManifestError);
});

test('twenty-plus first-party skill manifests are valid', () => {
  const catalog = JSON.parse(readFileSync(join(root, 'skills/catalog.json'), 'utf8'));
  assert.ok(catalog.skills.length >= 20, `expected >=20 skills, got ${catalog.skills.length}`);
  for (const s of catalog.skills) {
    const manifest = JSON.parse(
      readFileSync(join(root, 'skills', s.path, 'manifest.json'), 'utf8'),
    );
    assert.equal(manifest.id, s.id);
    assert.equal(manifest.type, 'skill');
    assert.ok(manifest.metadata.category);
    createManifest(manifest);
  }
});
