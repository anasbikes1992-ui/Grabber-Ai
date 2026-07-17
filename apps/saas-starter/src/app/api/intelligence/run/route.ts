import { NextResponse } from "next/server";
import { runIntelligencePipeline } from "@/intelligence/pipeline";
import { submitHandoffToCore } from "@/intelligence/submit-to-core";
import { join } from "node:path";

export const runtime = "nodejs";

/**
 * POST /api/intelligence/run
 * Body: { text, industry?, name_hint?, submit_to_core?: boolean }
 *
 * Product Intelligence only. Optional Core factory submit for wall KPI demos.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: ["invalid JSON body"] },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  const cwd = join(process.cwd());
  const result = runIntelligencePipeline(
    {
      text: payload.text,
      industry: payload.industry,
      business_model: payload.business_model,
      name_hint: payload.name_hint,
      locale: payload.locale,
    },
    { cwd },
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, errors: result.errors, result },
      { status: 422 },
    );
  }

  let core: Awaited<ReturnType<typeof submitHandoffToCore>> | null = null;
  if (payload.submit_to_core === true) {
    core = await submitHandoffToCore(result);
  }

  return NextResponse.json({
    ok: true,
    flow: [
      "client_request",
      "discovery",
      "requirements",
      "feature_classification",
      "project_dna",
      "builder_jobs",
      payload.submit_to_core ? "grabber_core" : "ready_for_core",
    ],
    dna: result.dna,
    handoff: result.handoff,
    requirements: result.requirements,
    classification: result.classification,
    prompts_used: result.prompts_used,
    core,
  });
}
