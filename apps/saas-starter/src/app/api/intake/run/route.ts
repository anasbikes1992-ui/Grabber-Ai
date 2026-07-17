import { NextResponse } from "next/server";
import { runIntakePipeline } from "@/intake/pipeline";
import { submitIntakeToCore } from "@/intake/submit";

export const runtime = "nodejs";

/**
 * POST /api/intake/run
 * Produces Project DNA + review package. Core submit only if approve+ready.
 *
 * Body: {
 *   text | conversation,
 *   name_hint?,
 *   clarifications?,
 *   uploads?,
 *   approve?: boolean,
 *   submit_to_core?: boolean
 * }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: ["invalid JSON"] },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  const approve = payload.approve === true;
  const submit = payload.submit_to_core === true;

  const result = runIntakePipeline(body, {
    cwd: process.cwd(),
    approved: approve,
  });

  const quality = result.dna.intelligence.quality;

  if (!result.ok && result.stages_completed.length === 0) {
    return NextResponse.json(
      { ok: false, errors: result.errors, result },
      { status: 422 },
    );
  }

  let core: Awaited<ReturnType<typeof submitIntakeToCore>> | null = null;
  if (submit) {
    core = await submitIntakeToCore(result, {
      approved: approve,
      execute_integrations: payload.execute_integrations === true,
      cwd: process.cwd(),
    });
  }

  const pipeline = [
    "client",
    "discovery",
    "project_dna",
    "review",
    quality.ready_for_build && approve ? "approve" : "awaiting_approval",
    ...(core?.ok
      ? [
          "grabber_core",
          "build",
          ...(core.integrations?.decisions
            .filter((d) => d.include)
            .map((d) => d.provider) ?? []),
          "production_url",
        ]
      : []),
  ];

  return NextResponse.json({
    ok: result.ok,
    stage: result.stage,
    stages_completed: result.stages_completed,
    pipeline,
    discovery: result.discovery,
    dna: result.dna,
    core_dna: result.core_dna,
    cost: result.cost,
    review: result.review,
    quality: {
      confidence: quality.confidence,
      completeness: quality.completeness,
      business_understanding: quality.business_understanding,
      requirements: quality.requirements,
      missing_information: quality.missing_information,
      ready_for_build: quality.ready_for_build,
      bars: quality.bars,
      clarifications_required: quality.clarifications_required,
      warnings: quality.warnings,
      builder_warnings: quality.builder_warnings,
    },
    kpis: {
      wall: "project_dna_to_validated_deployable",
      dna_completeness: quality.completeness,
      dna_confidence: quality.confidence,
      clarifications_required: quality.clarifications_required.length,
      builder_warnings: quality.builder_warnings.length,
      validation_errors: result.errors.length,
      production_url: core?.production_url ?? null,
      metrics_id: core?.metrics_id ?? null,
      module_reuse_rate: core?.module_reuse_rate ?? null,
      modules_assembled: core?.assembly?.modules.length ?? null,
    },
    handoff: result.handoff,
    core,
    integrations: core?.integrations ?? null,
    assembly: core?.assembly
      ? {
          ok: core.assembly.ok,
          resolved: core.assembly.resolved,
          module_reuse_rate: core.assembly.module_reuse_rate,
          composition: core.assembly.composition,
          issues: core.assembly.compatibility.issues,
        }
      : null,
    production_url: core?.production_url ?? null,
    errors: result.errors,
  });
}
