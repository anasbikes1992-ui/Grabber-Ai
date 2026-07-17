// Product Factory + reference project regression (EDR-007 / v1.8).
// Quality ≠ "tests pass". Quality = regenerate twice, equivalent artifacts,
// validation pass, cost budget, zero intervention, replayable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProductFactory, BUILDER_ORDER } from '../src/factory/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function loadDna(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

const REFS = [
  'reference-projects/saas-starter/project-dna.json',
  'reference-projects/crm/project-dna.json',
  'reference-projects/marketplace/project-dna.json',
];

test('plan returns full product pipeline', () => {
  const factory = createProductFactory();
  const dna = loadDna(REFS[0]);
  const plan = factory.plan(dna);
  assert.equal(plan.pipeline.length, BUILDER_ORDER.length);
  assert.equal(plan.pipeline[0].builder, 'builder.discovery');
  assert.equal(plan.pipeline.at(-1).builder, 'builder.documentation');
});

test('build SaaS starter: deployable product with zero intervention', async () => {
  const factory = createProductFactory();
  const dna = loadDna(REFS[0]);
  const result = await factory.build(dna, { projectId: 'saas-build-1' });
  assert.equal(result.ok, true);
  assert.equal(result.metrics.interventions, 0);
  assert.equal(result.metrics.human_intervention_rate, 0);
  assert.equal(result.metrics.validation_pass_rate, 1);
  assert.equal(result.metrics.replayable, true);
  assert.equal(result.metrics.withinBudget, true);
  assert.ok(result.metrics.durationMs >= 0);

  const v = factory.validate(result);
  assert.equal(v.ok, true);
  const d = factory.deploy(result);
  assert.equal(d.ready, true);
  assert.ok(result.product.files.length > 0);
  assert.ok(result.product.artifacts.api.content.resources.length >= 1);
});

test('marketplace exercises payments + multi-module surface', async () => {
  const factory = createProductFactory();
  const dna = loadDna(REFS[2]);
  const result = await factory.build(dna, { projectId: 'mkt-1' });
  assert.equal(factory.validate(result).ok, true);
  const modules = result.product.dna.architecture.modules;
  assert.ok(modules.includes('payments'));
  assert.ok(modules.includes('inventory'));
  assert.ok(modules.includes('search'));
  const tables = result.product.artifacts.database.content.tables.map((t) => t.name);
  assert.ok(tables.some((t) => t.includes('payment')));
  assert.ok(result.product.artifacts.frontend.content.routes.length >= 5);
});

test('reference suite: regenerate twice → equivalent artifacts (all three)', async () => {
  const factory = createProductFactory();
  for (const ref of REFS) {
    const dna = loadDna(ref);
    const name = dna.project.name;
    const regen = await factory.regenerate(dna, { projectId: `ref-${name}` });
    assert.equal(regen.equivalent, true, `${name} fingerprints must match across runs`);
    assert.equal(regen.bothValid, true, `${name} both runs must validate`);
    assert.equal(regen.bothReplayable, true, `${name} both runs must be replayable`);
    assert.equal(regen.bothWithinBudget, true, `${name} both runs within budget`);
    assert.equal(regen.interventions, 0, `${name} zero human intervention`);
  }
});

test('wall KPI metrics present on build', async () => {
  const factory = createProductFactory();
  const result = await factory.build(loadDna(REFS[1]), { projectId: 'crm-kpi' });
  assert.ok('durationMs' in result.metrics);
  assert.ok('cost' in result.metrics);
  assert.ok('interventions' in result.metrics);
  assert.ok(result.kpis.runtime_reliability >= 0);
});
