import { extractRequirements } from "./extract-requirements";
import { classifyFeatures } from "./classify-features";
import { generateProjectDna } from "./generate-dna";
import { buildDnaToCoreHandoff } from "./jobs";
import { listPromptIds, loadPrompt, loadPromptVersionCatalog } from "./prompts";
import type { ClientRequest, IntelligenceResult } from "./types";
import {
  validateClientRequest,
  validateClassification,
  validateDna,
  validateDnaToCore,
  validateRequirements,
} from "./validate";

/**
 * Product Intelligence Layer pipeline.
 * Produces DNA + Core handoff. Does NOT run the orchestrator — Core owns that.
 */
export function runIntelligencePipeline(
  input: unknown,
  opts: { cwd?: string } = {},
): IntelligenceResult {
  const errors: string[] = [];
  const prompts_used: { id: string; version: string }[] = [];

  const validated = validateClientRequest(input);
  if (!validated.ok || !validated.value) {
    return emptyFail(validated.errors);
  }
  const request: ClientRequest = validated.value;

  const promptRoot = opts.cwd
    ? `${opts.cwd.replace(/\\/g, "/")}/prompt-os`
    : undefined;

  let catalog;
  try {
    catalog = loadPromptVersionCatalog(promptRoot);
  } catch {
    catalog = {
      version: "0.2.0",
      prompts: Object.fromEntries(listPromptIds().map((k) => [k, "1.0.0"])),
    };
  }

  for (const name of listPromptIds()) {
    try {
      const p = loadPrompt(name as "discovery", promptRoot);
      prompts_used.push({ id: p.id, version: p.version });
    } catch {
      prompts_used.push({
        id: `prompt.${name}`,
        version: catalog.prompts[name] ?? "1.0.0",
      });
    }
  }

  const requirements = extractRequirements(request);
  errors.push(...validateRequirements(requirements));

  const classification = classifyFeatures(requirements);
  errors.push(...validateClassification(classification));

  const dna = generateProjectDna({
    request,
    requirements,
    classification,
    layerVersion: catalog.version,
    promptVersions: catalog.prompts,
  });
  errors.push(...validateDna(dna));

  const handoff = buildDnaToCoreHandoff(dna, opts.cwd);
  errors.push(...validateDnaToCore(handoff));

  return {
    ok: errors.length === 0,
    requirements,
    classification,
    dna,
    handoff,
    prompts_used,
    errors,
  };
}

function emptyFail(errors: string[]): IntelligenceResult {
  return {
    ok: false,
    requirements: {
      goals: [],
      users: [],
      critical_flows: [],
      acceptance: [],
      unknowns: [],
      risks: [],
    },
    classification: { features: [], modules: [], integrations: [] },
    dna: { project: {} as IntelligenceResult["dna"]["project"] },
    handoff: {
      kind: "dna-to-core",
      version: "0",
      dna: { project: {} as IntelligenceResult["dna"]["project"] },
      builder_jobs: [],
      submit_to: "grabber-core/product-factory",
    },
    prompts_used: [],
    errors,
  };
}
