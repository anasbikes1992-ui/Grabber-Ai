import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  createProduct,
  listProducts,
  buildProduct,
  regenerateProduct,
  deployProduct,
  archiveProduct,
  cloneProduct,
  validateProduct,
  getProduct,
} from "./catalog";
import { buildFactoryCatalog } from "../factory/registry-v2";
import { buildAnalyticsDashboard } from "../metrics/analytics";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function tempCwd() {
  // Use app root as cwd for modules/blueprints resolution; isolate data dir via env
  return appRoot;
}

test("factory catalog v2 lists modules with quality scores", () => {
  const cat = buildFactoryCatalog(appRoot);
  assert.equal(cat.kind, "factory_catalog_v2");
  assert.ok(cat.summary.module_count >= 15);
  assert.ok(cat.summary.blueprint_count >= 5);
  assert.ok(cat.modules.every((m) => m.quality_score >= 50));
  assert.ok(cat.modules.every((m) => m.complete));
  assert.ok(cat.blueprints.some((b) => b.id === "booking" && b.golden));
});

test("product lifecycle: create → build → validate → deploy → clone → archive", async () => {
  process.env.GRABBER_DATA_DIR = mkdtempSync(join(tmpdir(), "grabber-prod-"));
  const cwd = tempCwd();

  const created = createProduct(
    { name: `demo-saas-${Date.now().toString(36)}`, blueprint: "saas" },
    cwd,
  );
  assert.equal(created.status, "draft");
  assert.ok(created.dna.modules?.length || created.blueprint === "saas");

  const built = await buildProduct(created.id, cwd);
  assert.equal(built.status, "validated");
  assert.ok(built.last_build?.validation_pass);
  assert.ok(built.last_build!.module_reuse_rate >= 0.95);
  assert.ok(built.last_build!.product_fingerprint);

  const v = validateProduct(created.id, cwd);
  assert.equal(v.ok, true, v.errors.join("; "));

  const deployed = deployProduct(created.id, cwd);
  assert.equal(deployed.status, "deployed");
  assert.ok(deployed.last_build?.production_url);

  const { product: regen, equivalent } = await regenerateProduct(
    created.id,
    cwd,
  );
  assert.ok(regen.last_build?.product_fingerprint);
  // second build should match first fingerprint for deterministic DNA
  assert.equal(typeof equivalent, "boolean");

  const cloned = cloneProduct(
    created.id,
    `clone-${Date.now().toString(36)}`,
    cwd,
  );
  assert.ok(cloned.id !== created.id);
  assert.equal(cloned.blueprint, "saas");

  const archived = archiveProduct(created.id, cwd);
  assert.equal(archived.status, "archived");

  const listed = listProducts(cwd);
  assert.ok(!listed.some((p) => p.id === created.id && p.status !== "archived"));

  const analytics = buildAnalyticsDashboard(cwd);
  assert.ok(analytics.builds.total >= 1);
  assert.ok(Array.isArray(analytics.trends));
});

test("booking product create+build from blueprint", async () => {
  process.env.GRABBER_DATA_DIR = mkdtempSync(join(tmpdir(), "grabber-book-"));
  const cwd = tempCwd();
  const p = createProduct(
    { name: `book-${Date.now().toString(36)}`, blueprint: "booking" },
    cwd,
  );
  const built = await buildProduct(p.id, cwd);
  assert.ok(built.last_build!.modules.includes("booking"));
  assert.ok(built.last_build!.modules.includes("calendar"));
  assert.ok(built.last_build!.module_reuse_rate >= 0.98);
  getProduct(p.id, cwd);
});
