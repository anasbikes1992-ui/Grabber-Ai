import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runIntakePipeline } from "./pipeline";
import { CONFIDENCE_THRESHOLD } from "./validators";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("thin input is not ready for build — asks clarifications", () => {
  const r = runIntakePipeline(
    { text: "I want a simple app for my business maybe." },
    { cwd: appRoot },
  );
  assert.equal(r.ok, true);
  assert.equal(r.dna.intelligence.quality.ready_for_build, false);
  assert.ok(r.dna.intelligence.quality.clarifications_required.length >= 1);
  assert.ok(r.dna.intelligence.quality.missing_information > 20);
});

test("rich conversation produces rich DNA + high confidence", () => {
  const r = runIntakePipeline(
    {
      text: "Multi-tenant SaaS for agencies with email login, team invites, RBAC, and Stripe subscription billing. Admins configure tenants; members use the dashboard. Critical flows: sign up, invite member, upgrade plan.",
      name_hint: "agency-os",
      industry: "saas",
    },
    { cwd: appRoot },
  );
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.equal(r.dna.project.name, "agency-os");
  assert.ok(r.dna.modules.length >= 4);
  assert.ok(r.dna.integrations.includes("stripe"));
  assert.ok(r.dna.integrations.includes("supabase"));
  assert.equal(r.dna.deployment.provider, "vercel");
  assert.ok(r.dna.business.users.length >= 1);
  assert.ok(r.dna.intelligence.quality.confidence >= CONFIDENCE_THRESHOLD);
  assert.equal(r.dna.intelligence.quality.ready_for_build, true);
  assert.equal(r.dna.intelligence.quality.clarifications_required.length, 0);
  assert.ok(r.review.generated_jobs.length >= 10);
  assert.ok(r.cost.estimated_cost_usd > 0);
  // Core-compatible envelope for factory
  assert.equal(r.core_dna.project.name, "agency-os");
  assert.ok(r.core_dna.project.architecture.modules.length >= 1);
});

test("booking domain boosts calendar/payments modules", () => {
  const r = runIntakePipeline(
    {
      text: "Property booking platform with calendar scheduling, availability, Stripe payments, email notifications, and reviews for guests and hosts. Login required.",
      name_hint: "staybook",
    },
    { cwd: appRoot },
  );
  assert.equal(r.ok, true, r.errors.join("; "));
  assert.equal(r.domain, "booking");
  assert.ok(r.dna.modules.includes("calendar") || r.dna.modules.includes("bookings"));
  assert.ok(r.dna.modules.includes("payments") || r.dna.integrations.includes("stripe"));
  assert.equal(r.dna.project.type, "booking");
});

test("approve without ready_for_build is rejected", () => {
  const r = runIntakePipeline(
    { text: "Maybe a tool someday for stuff and things here." },
    { cwd: appRoot, approved: true },
  );
  assert.ok(
    r.errors.some((e) => /Cannot approve|confidence/i.test(e)) ||
      !r.handoff.approved,
  );
  assert.equal(r.handoff.approved, false);
});

test("approve when ready marks handoff approved", () => {
  const r = runIntakePipeline(
    {
      text: "Multi-tenant SaaS with email login, invites, RBAC, and Stripe billing for agencies managing client workspaces and dashboards.",
      name_hint: "agency-ready",
    },
    { cwd: appRoot, approved: true },
  );
  assert.equal(r.dna.intelligence.quality.ready_for_build, true);
  assert.equal(r.handoff.approved, true);
  assert.equal(r.stage, "submit");
});
