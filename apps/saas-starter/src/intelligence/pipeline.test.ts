import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runIntelligencePipeline } from "./pipeline";
import { validateDnaToCore } from "./validate";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("rejects short client request", () => {
  const r = runIntelligencePipeline({ text: "hi" }, { cwd: appRoot });
  assert.equal(r.ok, false);
  assert.ok(r.errors.length > 0);
});

test("discovery → requirements → DNA → core handoff", () => {
  const r = runIntelligencePipeline(
    {
      text: "We need a multi-tenant SaaS for teams with login, billing subscriptions, and invites.",
      name_hint: "team-saas",
      industry: "saas",
    },
    { cwd: appRoot },
  );
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.ok(r.requirements.goals.length >= 1);
  assert.ok(r.classification.modules.includes("tenants"));
  assert.ok(r.classification.modules.includes("billing"));
  assert.equal(r.dna.project.name, "team-saas");
  assert.equal(r.dna.project.template, "saas-starter");
  assert.ok(r.dna.project.intelligence.layer_version);
  assert.equal(r.handoff.submit_to, "grabber-core/product-factory");
  assert.ok(r.handoff.builder_jobs.length >= 10);
  assert.equal(validateDnaToCore(r.handoff).length, 0);
  assert.ok(r.prompts_used.some((p) => p.id.includes("discovery")));
});

test("booking language selects bookings module", () => {
  const r = runIntelligencePipeline(
    {
      text: "Property booking system with calendar scheduling and availability management for landlords.",
      name_hint: "property-booking",
    },
    { cwd: appRoot },
  );
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.ok(r.classification.modules.includes("bookings"));
  assert.ok(r.requirements.critical_flows.some((f) => /book/i.test(f)));
});
