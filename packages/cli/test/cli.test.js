import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { main, _internal } from '../src/cli.js';

function capture(fn) {
  const logs = [];
  const errs = [];
  const orig = console.log;
  const origErr = console.error;
  console.log = (...args) => { logs.push(args.map(String).join(' ')); };
  console.error = (...args) => { errs.push(args.map(String).join(' ')); };
  return Promise.resolve()
    .then(() => fn())
    .finally(() => {
      console.log = orig;
      console.error = origErr;
    })
    .then((code) => ({ code, logs, errs }));
}

test('grabber help exits 0', async () => {
  const { code, logs } = await capture(() => main(['help']));
  assert.equal(code, 0);
  assert.ok(logs.join('\n').includes('Foundation Layer'));
});

function parseLastJson(logs) {
  const text = logs.join('\n');
  // Prefer last complete JSON object in output (ignore structured log lines)
  const chunks = text.split(/\n(?=\{)/).filter((c) => c.trim().startsWith('{'));
  for (let i = chunks.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(chunks[i]);
    } catch {
      /* try previous */
    }
  }
  // fallback: entire output
  return JSON.parse(text);
}

test('grabber skill list returns catalog', async () => {
  const { code, logs } = await capture(() => main(['skill', 'list']));
  assert.equal(code, 0);
  const skills = JSON.parse(logs.join(''));
  assert.ok(skills.length >= 20);
});

test('grabber enterprise seed produces factory handoff', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ent-cli-'));
  process.env.GRABBER_ENTERPRISE_DIR = dir;
  const name = `Hotel-${Date.now().toString(36)}`;
  const { code, logs, errs } = await capture(() =>
    main(['enterprise', 'seed', name, 'hospitality']),
  );
  assert.equal(code, 0, logs.join('\n') + errs.join('\n'));
  const body = parseLastJson(logs);
  assert.equal(body.ok, true);
  assert.equal(body.engagement.factory_eligible, true);
  assert.ok(body.handoff.project_dna);
  assert.ok(body.handoff.fingerprint);

  const kpis = await capture(() => main(['enterprise', 'kpis']));
  assert.equal(kpis.code, 0, kpis.logs.join('\n'));
  const k = parseLastJson(kpis.logs);
  assert.ok(k.kpis.sales.proposals >= 1);
});

test('grabber init scaffolds workspace', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'grabber-'));
  const { code } = await capture(() => main(['init', dir]));
  assert.equal(code, 0);
  assert.ok(existsSync(join(dir, 'grabber.json')));
  const cfg = JSON.parse(readFileSync(join(dir, 'grabber.json'), 'utf8'));
  assert.equal(cfg.version, '2.0.0');
});

test('grabber runtime status works', async () => {
  const { code, logs } = await capture(() => main(['runtime', 'status']));
  assert.equal(code, 0);
  const status = JSON.parse(logs.join(''));
  assert.ok(Array.isArray(status.capabilities));
});

test('grabber plan saas shows pipeline', async () => {
  const { code, logs } = await capture(() => main(['plan', 'saas']));
  assert.equal(code, 0);
  const plan = JSON.parse(logs.join(''));
  assert.ok(plan.pipeline?.length >= 10 || plan.ok);
});

// silence unused export warning in some harnesses
void _internal;
