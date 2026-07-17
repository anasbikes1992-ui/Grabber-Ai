import {
  dnaToIntegrationView,
  runIntegrationLayer,
  type IntegrationLayerResult,
} from "@/integrations";
import { recordFactoryMetrics } from "@/metrics";
import {
  assembleModules,
  assemblyToCoreModules,
  type AssemblyResult,
} from "@/modules";
import type { IntakeResult } from "./types";

export type CoreSubmitResult = {
  ok: boolean;
  blocked?: boolean;
  reason?: string;
  productFingerprint?: string;
  durationMs?: number;
  interventions?: number;
  dna_completeness?: number;
  dna_confidence?: number;
  error?: string;
  /** Sprint 4 — DNA-driven integration layer */
  integrations?: IntegrationLayerResult;
  production_url?: string;
  metrics_id?: string;
  /** Sprint 5 — business module assembly */
  assembly?: AssemblyResult;
  module_reuse_rate?: number;
};

/**
 * Submit to Grabber Core only when ready_for_build + human approved.
 * Then run Integration Layer (planner → providers) and record factory metrics.
 */
export async function submitIntakeToCore(
  result: IntakeResult,
  opts: { approved: boolean; execute_integrations?: boolean; cwd?: string },
): Promise<CoreSubmitResult> {
  const q = result.dna.intelligence.quality;

  if (!opts.approved) {
    return {
      ok: false,
      blocked: true,
      reason: "Human approval required before Core submit.",
      dna_completeness: q.completeness,
      dna_confidence: q.confidence,
    };
  }

  if (!q.ready_for_build) {
    return {
      ok: false,
      blocked: true,
      reason: `DNA not ready (confidence ${q.confidence}%, completeness ${q.completeness}%). Clarifications: ${q.clarifications_required.join("; ")}`,
      dna_completeness: q.completeness,
      dna_confidence: q.confidence,
    };
  }

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
            builders: number;
            cost?: { actual_cost?: number };
          };
        }>;
        validate: (build: unknown) => { ok: boolean; errors: string[] };
      };
    };

    // Sprint 5 — assemble registered business modules from DNA selection
    const assembly = assembleModules(result.dna.modules, {
      productType: result.dna.project.type || result.domain,
      cwd: opts.cwd ?? process.cwd(),
    });
    if (!assembly.ok) {
      return {
        ok: false,
        error: `Module assembly failed: ${assembly.errors.join("; ")}`,
        dna_completeness: q.completeness,
        dna_confidence: q.confidence,
        assembly,
        module_reuse_rate: assembly.module_reuse_rate,
      };
    }

    const assembled = assemblyToCoreModules(assembly);
    // Enrich Core DNA with assembled module graph (deterministic catalog)
    const coreDna = {
      ...result.core_dna,
      project: {
        ...result.core_dna.project,
        architecture: {
          ...result.core_dna.project.architecture,
          modules: assembled.modules,
        },
        integrations: unique([
          ...(result.core_dna.project.integrations ?? []),
          ...assembled.integrations,
        ]),
        intelligence: {
          ...(result.core_dna.project.intelligence ?? {}),
          module_assembly: assembled.assembly_meta,
          composition: {
            entities: assembled.entities,
            endpoints: assembled.endpoints,
            permissions: assembled.permissions,
          },
        },
      },
    };

    const factory = factoryMod.createProductFactory();
    const build = await factory.build(coreDna, {
      projectId: result.dna.project.name,
    });
    const validation = factory.validate(build);
    if (!validation.ok) {
      const metrics = recordFactoryMetrics(
        {
          project_name: result.dna.project.name,
          dna_completeness: q.completeness,
          dna_confidence: q.confidence,
          clarifications_required: q.clarifications_required.length,
          build_duration_ms: build.metrics.durationMs,
          validation_pass: false,
          manual_interventions: build.metrics.interventions,
          integrations_planned: [],
          integrations_dry_run: true,
          module_reuse_rate: assembly.module_reuse_rate,
          modules_assembled: assembly.modules.length,
          modules_requested: assembly.requested.length,
          notes: validation.errors,
        },
        opts.cwd ?? process.cwd(),
      );
      return {
        ok: false,
        error: validation.errors.join("; "),
        dna_completeness: q.completeness,
        dna_confidence: q.confidence,
        metrics_id: metrics.id,
        assembly,
        module_reuse_rate: assembly.module_reuse_rate,
      };
    }

    // Integration Layer — driven by DNA, not hard-coded service calls
    const view = dnaToIntegrationView({
      ...result.dna,
      modules: assembled.modules,
      integrations: unique([
        ...result.dna.integrations,
        ...assembled.integrations,
      ]),
    });
    const integrations = runIntegrationLayer(view, {
      execute: opts.execute_integrations === true,
    });

    const metrics = recordFactoryMetrics(
      {
        project_name: result.dna.project.name,
        product_fingerprint: build.productFingerprint,
        dna_completeness: q.completeness,
        dna_confidence: q.confidence,
        clarifications_required: q.clarifications_required.length,
        build_duration_ms: build.metrics.durationMs,
        validation_pass: true,
        manual_interventions: build.metrics.interventions,
        deployment_success: Boolean(integrations.production_url),
        total_build_cost_usd:
          (build.metrics.cost as { actual_cost?: number } | undefined)
            ?.actual_cost ?? result.cost.estimated_cost_usd,
        integrations_planned: integrations.decisions
          .filter((d) => d.include)
          .map((d) => d.provider),
        integrations_dry_run: integrations.results.every((r) => r.dry_run),
        production_url: integrations.production_url,
        module_reuse_rate: assembly.module_reuse_rate,
        modules_assembled: assembly.modules.length,
        modules_requested: assembly.requested.length,
      },
      opts.cwd ?? process.cwd(),
    );

    return {
      ok: true,
      productFingerprint: build.productFingerprint,
      durationMs: build.metrics.durationMs,
      interventions: build.metrics.interventions,
      dna_completeness: q.completeness,
      dna_confidence: q.confidence,
      integrations,
      production_url: integrations.production_url,
      metrics_id: metrics.id,
      assembly,
      module_reuse_rate: assembly.module_reuse_rate,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      dna_completeness: q.completeness,
      dna_confidence: q.confidence,
    };
  }
}

function unique(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}
