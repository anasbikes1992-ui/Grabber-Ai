/**
 * Golden reference product runner — regression suite for Product Factory.
 * Minimal bespoke code: load DNA → materialize blueprint → assemble → Core.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { materializeProductDna } from "./materialize";
import { goldenBlueprints, loadBlueprint, blueprintsRoot } from "./registry";
import type { DeclarativeProductDna } from "./types";
import { recordFactoryMetrics } from "@/metrics";

export type ReferenceRunResult = {
  ok: boolean;
  product: string;
  blueprint: string;
  modules: string[];
  module_reuse_rate: number;
  productFingerprint?: string;
  durationMs?: number;
  interventions?: number;
  regeneration_equivalent?: boolean;
  production_url?: string;
  metrics_id?: string;
  errors: string[];
};

export function referenceProjectsRoot(cwd = process.cwd()): string {
  const candidates = [
    join(cwd, "reference-projects"),
    join(cwd, "apps/saas-starter/reference-projects"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return join(cwd, "reference-projects");
}

export function loadReferenceDna(
  id: string,
  cwd = process.cwd(),
): DeclarativeProductDna {
  const path = join(referenceProjectsRoot(cwd), id, "project-dna.json");
  return JSON.parse(readFileSync(path, "utf8")) as DeclarativeProductDna;
}

/**
 * Run a golden reference product end-to-end through assembly + Core factory.
 */
export async function runReferenceProduct(
  id: string,
  opts: { cwd?: string; regenerate?: boolean } = {},
): Promise<ReferenceRunResult> {
  const cwd = opts.cwd ?? process.cwd();
  const errors: string[] = [];

  let dna: DeclarativeProductDna;
  try {
    dna = loadReferenceDna(id, cwd);
  } catch (e) {
    return {
      ok: false,
      product: id,
      blueprint: id,
      modules: [],
      module_reuse_rate: 0,
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }

  const materialized = materializeProductDna(dna, { cwd });
  if (!materialized.ok || !materialized.assembly) {
    return {
      ok: false,
      product: id,
      blueprint: materialized.blueprint?.product_type ?? id,
      modules: materialized.modules,
      module_reuse_rate: materialized.assembly?.module_reuse_rate ?? 0,
      errors: materialized.errors,
    };
  }

  const assembly = materialized.assembly;
  const name = materialized.name;

  // Core-compatible DNA for Product Factory builders
  const coreDna = {
    project: {
      name,
      template: materialized.product_type,
      industry:
        (dna.project as { industry?: string } | undefined)?.industry ??
        materialized.product_type,
      business_model:
        (dna.project as { business_model?: string } | undefined)
          ?.business_model ?? "services",
      users:
        (dna.project as { users?: { role: string; goals: string[] }[] })
          ?.users ?? [{ role: "admin", goals: ["operate product"] }],
      goals:
        (dna.project as { goals?: string[] } | undefined)?.goals ?? [
          `Deliver ${name}`,
        ],
      constraints: {
        must: ["assemble from Factory Registry modules"],
        should: [
          `module reuse >= ${materialized.quality_policy.min_module_reuse_rate}`,
        ],
        may: [],
        must_not: ["hand-write domain logic outside catalog modules"],
        assumptions: ["Sprint 6 declarative reference"],
        unknowns: [],
        risks: [],
        ...((dna.constraints as object) ?? {}),
      },
      integrations: materialized.integrations,
      architecture: {
        style: "modular-monolith",
        modules: assembly.resolved,
      },
      stack: "crud-dashboard (Next.js + Supabase)",
      conventions: {
        db_naming: "plural",
        api_envelope: "data/error+trace_id",
        breakpoints: ["sm", "md", "lg"],
      },
      security_level:
        materialized.quality_policy.security === "high"
          ? "elevated"
          : "standard",
      authorization: {
        model: "rbac",
        roles:
          (dna.authorization as { roles?: string[] } | undefined)?.roles ?? [
            "admin",
          ],
      },
      accessibility_level: "WCAG-2.1-AA",
      performance_targets: {
        lcp_ms: 2500,
        inp_ms: 200,
        api_p95_ms: 400,
      },
      data: { retention: "account-lifetime", regulated: false },
      deployment_targets: {
        environments: materialized.blueprint.deployment.environments,
        uptime_target: "99.9%",
        backup_schedule: "daily",
      },
      critical_flows:
        (dna.project as { critical_flows?: string[] } | undefined)
          ?.critical_flows ?? [],
      standards_version: "stds-1.0.0",
      decision_registry: ["EDR-007"],
      intelligence: {
        blueprint: materialized.blueprint.id,
        module_assembly: {
          module_reuse_rate: assembly.module_reuse_rate,
          resolved: assembly.modules.map((m) => ({
            name: m.name,
            version: m.version,
          })),
        },
        composition: assembly.composition,
      },
    },
  };

  try {
    const factoryMod = (await import(
      /* webpackIgnore: true */
      "../../../../runtime/src/factory/index.js"
    )) as {
      createProductFactory: () => {
        build: (
          dna: unknown,
          opts?: { projectId?: string },
        ) => Promise<{
          productFingerprint: string;
          metrics: {
            durationMs: number;
            interventions: number;
            cost?: { actual_cost?: number };
          };
        }>;
        validate: (b: unknown) => { ok: boolean; errors: string[] };
        regenerate: (
          dna: unknown,
          opts?: { projectId?: string },
        ) => Promise<{
          equivalent: boolean;
          bothValid: boolean;
          interventions: number;
        }>;
      };
    };

    const factory = factoryMod.createProductFactory();
    const build = await factory.build(coreDna, { projectId: name });
    const validation = factory.validate(build);
    if (!validation.ok) {
      errors.push(...validation.errors);
    }

    let regeneration_equivalent: boolean | undefined;
    if (opts.regenerate !== false) {
      const regen = await factory.regenerate(coreDna, {
        projectId: `${name}-regen`,
      });
      regeneration_equivalent = regen.equivalent && regen.bothValid;
      if (!regeneration_equivalent) {
        errors.push("Regeneration equivalence failed");
      }
    }

    // Integration dry-run for production URL plan
    const { runIntegrationLayer } = await import("@/integrations");
    const integrations = runIntegrationLayer({
      project: { name, type: materialized.product_type },
      modules: assembly.resolved,
      integrations: materialized.integrations,
      deployment: { provider: materialized.blueprint.deployment.provider },
    });

    const metrics = recordFactoryMetrics(
      {
        project_name: name,
        product_fingerprint: build.productFingerprint,
        dna_completeness: 100,
        dna_confidence: 100,
        clarifications_required: 0,
        build_duration_ms: build.metrics.durationMs,
        validation_pass: validation.ok,
        manual_interventions: build.metrics.interventions,
        regeneration_equivalent,
        deployment_success: Boolean(integrations.production_url),
        total_build_cost_usd:
          (build.metrics.cost as { actual_cost?: number } | undefined)
            ?.actual_cost ?? 0,
        integrations_planned: integrations.decisions
          .filter((d) => d.include)
          .map((d) => d.provider),
        integrations_dry_run: true,
        production_url: integrations.production_url,
        module_reuse_rate: assembly.module_reuse_rate,
        modules_assembled: assembly.modules.length,
        modules_requested: assembly.requested.length,
        notes: [`blueprint:${materialized.blueprint.id}`, `reference:${id}`],
      },
      cwd,
    );

    return {
      ok: errors.length === 0,
      product: name,
      blueprint: materialized.blueprint.product_type,
      modules: assembly.resolved,
      module_reuse_rate: assembly.module_reuse_rate,
      productFingerprint: build.productFingerprint,
      durationMs: build.metrics.durationMs,
      interventions: build.metrics.interventions,
      regeneration_equivalent,
      production_url: integrations.production_url,
      metrics_id: metrics.id,
      errors,
    };
  } catch (e) {
    return {
      ok: false,
      product: name,
      blueprint: materialized.product_type,
      modules: assembly.resolved,
      module_reuse_rate: assembly.module_reuse_rate,
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }
}

/** Run all golden reference products (regression suite). */
export async function runGoldenReferenceSuite(
  opts: { cwd?: string } = {},
): Promise<{ ok: boolean; results: ReferenceRunResult[] }> {
  const cwd = opts.cwd ?? process.cwd();
  const golden = goldenBlueprints(cwd);
  const results: ReferenceRunResult[] = [];

  for (const id of golden) {
    // reference-projects folder name matches blueprint id
    const refPath = join(referenceProjectsRoot(cwd), id, "project-dna.json");
    if (!existsSync(refPath)) {
      results.push({
        ok: false,
        product: id,
        blueprint: id,
        modules: [],
        module_reuse_rate: 0,
        errors: [`missing reference DNA at ${refPath}`],
      });
      continue;
    }
    results.push(await runReferenceProduct(id, { cwd }));
  }

  return {
    ok: results.every((r) => r.ok),
    results,
  };
}

// re-export helpers used in docs
export { loadBlueprint, blueprintsRoot };
