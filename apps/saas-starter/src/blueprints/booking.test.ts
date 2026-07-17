import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  listBlueprints,
  loadBlueprint,
  loadReferenceDna,
  materializeProductDna,
  runReferenceProduct,
  runGoldenReferenceSuite,
} from "./index";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("blueprint registry includes booking and golden set", () => {
  const ids = listBlueprints(appRoot);
  assert.ok(ids.includes("booking"));
  assert.ok(ids.includes("saas"));
  assert.ok(ids.includes("crm"));
  assert.ok(ids.includes("marketplace"));
  const booking = loadBlueprint("booking", appRoot);
  assert.equal(booking.product_type, "booking");
  assert.ok(booking.modules.required.includes("calendar"));
  assert.ok(booking.modules.required.includes("booking"));
  assert.ok(booking.quality.min_module_reuse_rate >= 0.98);
});

test("declarative booking DNA materializes with high reuse", () => {
  const dna = loadReferenceDna("booking", appRoot);
  assert.equal(dna.product?.type, "booking");
  assert.ok((dna.modules ?? []).includes("booking"));

  const m = materializeProductDna(dna, { cwd: appRoot });
  assert.equal(m.ok, true, m.errors.join("; "));
  assert.ok(m.assembly);
  assert.ok(m.assembly!.module_reuse_rate >= 0.98);
  // deps resolved
  assert.ok(m.modules.includes("authentication"));
  assert.ok(m.modules.includes("calendar"));
  assert.ok(m.modules.includes("payments"));
  assert.ok(m.integrations.includes("stripe"));
  assert.ok(m.integrations.includes("vercel"));
});

test("booking reference product: assemble → Core → regen equivalence", async () => {
  const r = await runReferenceProduct("booking", {
    cwd: appRoot,
    regenerate: true,
  });
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.equal(r.blueprint, "booking");
  assert.ok(r.module_reuse_rate >= 0.98);
  assert.ok(r.productFingerprint);
  assert.equal(r.interventions, 0);
  assert.equal(r.regeneration_equivalent, true);
  assert.ok(r.production_url?.includes("booking"));
  assert.ok(r.modules.includes("booking"));
  assert.ok(r.modules.includes("calendar"));
});

test("golden reference suite: saas, crm, marketplace, booking", async () => {
  const suite = await runGoldenReferenceSuite({ cwd: appRoot });
  assert.equal(suite.ok, true, JSON.stringify(suite.results.filter((r) => !r.ok)));
  assert.equal(suite.results.length, 4);
  for (const r of suite.results) {
    assert.equal(r.ok, true, `${r.product}: ${r.errors.join("; ")}`);
    assert.ok(r.module_reuse_rate >= 0.95, r.product);
    assert.equal(r.regeneration_equivalent, true, r.product);
  }
});
