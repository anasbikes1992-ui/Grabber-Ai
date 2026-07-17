import { extractRequirements } from "@/intelligence/extract-requirements";
import { classifyFeatures } from "@/intelligence/classify-features";
import { loadBuilderManifest } from "@/intelligence/jobs";
import { loadPromptVersionCatalog } from "@/intelligence/prompts";
import { identifyDomain } from "./domain";
import { buildRichDna, toCoreCompatibleDna, INTAKE_VERSION } from "./dna";
import { estimateCost } from "./estimators";
import { expandConversation, parseIntakeInput } from "./parser";
import { validateRichDna } from "./validators";
import type { IntakeResult, PipelineStage } from "./types";

const STAGES: PipelineStage[] = [
  "business_discovery",
  "requirement_extraction",
  "feature_detection",
  "module_selection",
  "domain_identification",
  "architecture_selection",
  "project_dna",
  "cost_estimate",
  "review",
  "submit",
];

/**
 * Canonical intake pipeline: Client → … → Project DNA → Review → (optional) Core.
 * Goal is DNA production with confidence gating — not form UI.
 */
export function runIntakePipeline(
  raw: unknown,
  opts: { cwd?: string; approved?: boolean } = {},
): IntakeResult {
  const errors: string[] = [];
  const stages_completed: PipelineStage[] = [];

  const parsed = parseIntakeInput(raw);
  if (!parsed.ok || !parsed.value) {
    return fail(parsed.errors, "business_discovery");
  }
  const input = parsed.value;
  const text = expandConversation(input);
  stages_completed.push("business_discovery");

  // Requirement extraction (reuse intelligence extractors)
  const requirements = extractRequirements({
    text,
    industry: input.industry,
    business_model: input.business_model,
    name_hint: input.name_hint,
    locale: input.locale,
  });
  stages_completed.push("requirement_extraction");

  const classification = classifyFeatures(requirements);
  stages_completed.push("feature_detection");
  stages_completed.push("module_selection");

  const domainInfo = identifyDomain(text, classification);
  stages_completed.push("domain_identification");
  stages_completed.push("architecture_selection");

  let layerVersion = INTAKE_VERSION;
  try {
    const cat = loadPromptVersionCatalog(
      opts.cwd ? `${opts.cwd}/prompt-os` : undefined,
    );
    layerVersion = cat.version;
  } catch {
    /* defaults */
  }

  const dna = buildRichDna({
    input,
    text,
    requirements,
    classification,
    domain: domainInfo.domain,
    industry: domainInfo.industry,
    type: domainInfo.type,
    layerVersion,
  });
  stages_completed.push("project_dna");
  errors.push(...validateRichDna(dna));

  const core_dna = toCoreCompatibleDna(dna);
  const manifest = loadBuilderManifest(opts.cwd);
  const builder_jobs = manifest.builders;
  const cost = estimateCost(dna, builder_jobs);
  stages_completed.push("cost_estimate");

  const quality = dna.intelligence.quality;
  const review = {
    modules: dna.modules,
    integrations: dna.integrations,
    estimated_cost: cost,
    generated_jobs: builder_jobs,
    deployment_target: dna.deployment.provider,
    validation_warnings: [
      ...quality.warnings,
      ...quality.builder_warnings,
    ],
    quality,
  };
  stages_completed.push("review");

  const approved = Boolean(opts.approved) && quality.ready_for_build;
  if (opts.approved && !quality.ready_for_build) {
    errors.push(
      "Cannot approve: DNA confidence/completeness below threshold — resolve clarifications first.",
    );
  }

  let stage: PipelineStage = "review";
  if (approved) {
    stages_completed.push("submit");
    stage = "submit";
  }

  return {
    ok: errors.length === 0,
    stage,
    stages_completed,
    discovery: {
      summary: dna.business.value_proposition,
      domain: domainInfo.domain,
      industry: dna.project.industry,
    },
    requirements: {
      goals: requirements.goals,
      users: requirements.users,
      critical_flows: requirements.critical_flows,
      acceptance: requirements.acceptance,
      unknowns: requirements.unknowns,
      risks: requirements.risks,
    },
    features: dna.features,
    modules: dna.modules,
    domain: domainInfo.domain,
    architecture: dna.architecture,
    dna,
    core_dna,
    cost,
    review,
    handoff: {
      kind: "dna-to-core",
      version: manifest.version,
      submit_to: "grabber-core/product-factory",
      builder_jobs,
      approved,
    },
    errors,
  };
}

function fail(errors: string[], stage: PipelineStage): IntakeResult {
  const emptyQuality = {
    confidence: 0,
    completeness: 0,
    business_understanding: 0,
    requirements: 0,
    missing_information: 100,
    ready_for_build: false,
    bars: [],
    clarifications_required: errors,
    warnings: [],
    builder_warnings: [],
  };
  return {
    ok: false,
    stage,
    stages_completed: [],
    discovery: { summary: "", domain: "generic", industry: "" },
    requirements: {
      goals: [],
      users: [],
      critical_flows: [],
      acceptance: [],
      unknowns: [],
      risks: [],
    },
    features: [],
    modules: [],
    domain: "generic",
    architecture: {
      style: "",
      stack: "",
      conventions: { db_naming: "", api_envelope: "", breakpoints: [] },
    },
    dna: {
      project: {
        name: "",
        type: "",
        industry: "",
        target: "web",
        template: "",
        business_model: "",
        goals: [],
        critical_flows: [],
        standards_version: "",
        decision_registry: [],
      },
      business: { users: [], user_goals: [], value_proposition: "" },
      modules: [],
      features: [],
      integrations: [],
      architecture: {
        style: "",
        stack: "",
        conventions: { db_naming: "", api_envelope: "", breakpoints: [] },
      },
      deployment: {
        provider: "",
        environments: [],
        uptime_target: "",
        backup_schedule: "",
      },
      quality: {
        security: "standard",
        testing: "required",
        accessibility: "",
      },
      constraints: {
        must: [],
        should: [],
        may: [],
        must_not: [],
        assumptions: [],
        unknowns: [],
        risks: [],
      },
      authorization: { model: "", roles: [] },
      data: { retention: "", regulated: false },
      performance_targets: { lcp_ms: 0, inp_ms: 0, api_p95_ms: 0 },
      intelligence: {
        layer_version: "",
        intake_version: INTAKE_VERSION,
        source_request_hash: "",
        quality: emptyQuality,
      },
    },
    core_dna: { project: {} as IntakeResult["core_dna"]["project"] },
    cost: {
      currency: "USD",
      estimated_tokens: 0,
      estimated_cost_usd: 0,
      estimated_duration_minutes: 0,
      builders: 0,
      notes: [],
    },
    review: {
      modules: [],
      integrations: [],
      estimated_cost: {
        currency: "USD",
        estimated_tokens: 0,
        estimated_cost_usd: 0,
        estimated_duration_minutes: 0,
        builders: 0,
        notes: [],
      },
      generated_jobs: [],
      deployment_target: "",
      validation_warnings: [],
      quality: emptyQuality,
    },
    handoff: {
      kind: "dna-to-core",
      version: "0",
      submit_to: "grabber-core/product-factory",
      builder_jobs: [],
      approved: false,
    },
    errors,
  };
}

export { STAGES };
