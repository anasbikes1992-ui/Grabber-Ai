/**
 * Milestone 4 — factory governance gate tests.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import {
  assertFactoryGovernance,
  handoffToProductDna,
  monorepoRootSync,
} from "./governance-gate";

const ROOT = monorepoRootSync(process.cwd());

async function ent() {
  const p = join(ROOT, "packages/enterprise/src/index.js");
  return import(pathToFileURL(p).href);
}

test("catalog builds skip governance when no engagement_id", async () => {
  const r = await assertFactoryGovernance({
    engagementId: null,
    cwd: process.cwd(),
  });
  assert.equal(r.required, false);
});

test("factory gate blocks incomplete engagement", async () => {
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), "gate-"));
  const api = await ent();
  const e = api.createEngagement(
    { name: "Blocked Co", industry: "saas" },
    ROOT,
  );
  await assert.rejects(
    () => assertFactoryGovernance({ engagementId: e.id, cwd: process.cwd() }),
    /approval|deposit|commercial|DNA/i,
  );
});

test("factory-ready engagement yields handoff DNA", async () => {
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), "gate-ok-"));
  const api = await ent();
  const { engagement, handoff } = api.milestone1Sync(
    "Gate Hotel",
    "hospitality",
    ROOT,
  );
  assert.equal(handoff.factory_eligible, true);
  const packed = await handoffToProductDna(engagement.id, process.cwd());
  assert.ok(packed.dna);
  assert.equal(packed.handoff.engagement_id, engagement.id);
  assert.ok(packed.blueprint);
});
