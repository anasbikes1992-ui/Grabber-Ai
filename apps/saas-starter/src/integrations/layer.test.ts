import { test } from "node:test";
import assert from "node:assert/strict";
import { planIntegrations } from "./planner";
import { runIntegrationLayer } from "./layer";
import {
  recordFactoryMetrics,
  resetFactoryMetrics,
  summarizeFactoryMetrics,
} from "../metrics";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

test("planner includes stripe for booking DNA with payments", () => {
  const decisions = planIntegrations({
    project: { name: "staybook", type: "booking" },
    modules: ["authentication", "bookings", "payments"],
    integrations: ["supabase", "github"],
    deployment: { provider: "vercel" },
  });
  const by = Object.fromEntries(decisions.map((d) => [d.provider, d]));
  assert.equal(by.github.include, true);
  assert.equal(by.supabase.include, true);
  assert.equal(by.stripe.include, true);
  assert.equal(by.vercel.include, true);
});

test("planner skips stripe when no payments signal", () => {
  const decisions = planIntegrations({
    project: { name: "docs-only", type: "saas" },
    modules: ["core", "authentication"],
    integrations: ["supabase", "github"],
    deployment: { provider: "vercel" },
  });
  const stripe = decisions.find((d) => d.provider === "stripe");
  assert.equal(stripe?.include, false);
});

test("integration layer dry-run produces production URL plan", () => {
  const result = runIntegrationLayer({
    project: { name: "agency-os", type: "saas" },
    modules: ["tenants", "users", "billing", "payments"],
    integrations: ["stripe", "supabase", "github"],
    deployment: { provider: "vercel" },
  });
  assert.equal(result.ok, true);
  assert.ok(result.production_url?.includes("agency-os"));
  assert.ok(result.workflow.includes("grabber_core"));
  assert.ok(result.workflow.includes("vercel"));
  assert.ok(result.results.every((r) => r.include === false || r.dry_run));
  const github = result.results.find((r) => r.provider === "github");
  assert.ok(github?.steps.some((s) => s.id === "create_repo"));
});

test("factory metrics record and summarize", () => {
  const cwd = mkdtempSync(join(tmpdir(), "grabber-metrics-"));
  resetFactoryMetrics(cwd);
  recordFactoryMetrics(
    {
      project_name: "a",
      dna_completeness: 90,
      dna_confidence: 88,
      clarifications_required: 0,
      build_duration_ms: 100,
      validation_pass: true,
      manual_interventions: 0,
      deployment_success: true,
      total_build_cost_usd: 0.05,
      integrations_planned: ["github", "vercel"],
      integrations_dry_run: true,
      production_url: "https://a.vercel.app",
    },
    cwd,
  );
  recordFactoryMetrics(
    {
      project_name: "b",
      dna_completeness: 70,
      dna_confidence: 72,
      clarifications_required: 2,
      build_duration_ms: 200,
      validation_pass: false,
      manual_interventions: 1,
      deployment_success: false,
      total_build_cost_usd: 0.02,
      integrations_planned: [],
      integrations_dry_run: true,
    },
    cwd,
  );
  const s = summarizeFactoryMetrics(cwd);
  assert.equal(s.builds, 2);
  assert.equal(s.avg_dna_completeness, 80);
  assert.equal(s.validation_pass_rate, 0.5);
  assert.ok(s.avg_build_duration_ms === 150);
});

// silence unused import lint in some runners
void dirname;
void fileURLToPath;
