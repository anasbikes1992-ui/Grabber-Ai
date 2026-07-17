import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGrabberClient } from '../src/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const pilotDna = JSON.parse(
  readFileSync(join(root, 'projects/pilot-task-manager/project-dna.json'), 'utf8'),
);

test('SDK ProjectClient + DNAClient create and read project', () => {
  const client = createGrabberClient();
  const created = client.project.create({ id: 'sdk-proj', dna: pilotDna });
  assert.equal(created.id, 'sdk-proj');
  assert.equal(created.stage, 'intake');
  assert.equal(client.dna.section('sdk-proj', 'industry'), 'productivity');
  assert.ok(client.rule.get('AR-11'));
  assert.ok(client.decision.get('EDR-005') || client.decision.get('EDR-004'));
});

test('SDK SearchClient and GraphClient are wired', () => {
  const client = createGrabberClient();
  client.project.create({ id: 'sdk-search', dna: pilotDna });
  const hit = client.search.ask('task manager pattern', { q: 'task manager' });
  assert.ok(hit.kind);
  const impact = client.graph.impact({ projectId: 'sdk-search', seeds: ['dna:sdk-search'] });
  assert.ok(Array.isArray(impact.stale_artifacts));
});

test('SDK runtime status reports capabilities', () => {
  const client = createGrabberClient();
  const status = client.runtime.status();
  assert.ok(status.capabilities.length >= 1);
  assert.equal(typeof status.eventDepth, 'number');
});
