import type {
  ClientRequest,
  DnaToCoreHandoff,
  FeatureClassification,
  ProjectDnaDocument,
  Requirements,
} from "./types";

export function validateClientRequest(input: unknown): {
  ok: boolean;
  value?: ClientRequest;
  errors: string[];
} {
  const errors: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["client request must be an object"] };
  }
  const r = input as Record<string, unknown>;
  if (typeof r.text !== "string" || r.text.trim().length < 8) {
    errors.push("text must be a string with at least 8 characters");
  }
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      text: String(r.text).trim(),
      industry: r.industry ? String(r.industry) : undefined,
      business_model: r.business_model ? String(r.business_model) : undefined,
      locale: r.locale ? String(r.locale) : "en",
      name_hint: r.name_hint ? String(r.name_hint) : undefined,
    },
    errors: [],
  };
}

export function validateRequirements(req: Requirements): string[] {
  const errors: string[] = [];
  if (!req.goals?.length) errors.push("requirements.goals required");
  if (!req.users?.length) errors.push("requirements.users required");
  if (!req.acceptance?.length) errors.push("requirements.acceptance required");
  return errors;
}

export function validateClassification(c: FeatureClassification): string[] {
  const errors: string[] = [];
  if (!c.modules?.length) errors.push("classification.modules required");
  if (!c.features?.length) errors.push("classification.features required");
  return errors;
}

export function validateDna(dna: ProjectDnaDocument): string[] {
  const errors: string[] = [];
  const p = dna?.project;
  if (!p) return ["dna.project required"];
  if (!p.name) errors.push("dna.project.name required");
  if (!p.goals?.length) errors.push("dna.project.goals required");
  if (!p.architecture?.style) errors.push("dna.project.architecture.style required");
  if (!p.architecture?.modules?.length) {
    errors.push("dna.project.architecture.modules required");
  }
  if (!p.stack) errors.push("dna.project.stack required");
  if (!p.standards_version) errors.push("dna.project.standards_version required");
  if (!p.constraints?.must) errors.push("dna.project.constraints.must required");
  return errors;
}

export function validateDnaToCore(h: DnaToCoreHandoff): string[] {
  const errors: string[] = [];
  if (h.kind !== "dna-to-core") errors.push("handoff.kind must be dna-to-core");
  if (h.submit_to !== "grabber-core/product-factory") {
    errors.push("handoff must submit_to grabber-core/product-factory");
  }
  if (!h.builder_jobs?.length) errors.push("builder_jobs required");
  errors.push(...validateDna(h.dna));
  return errors;
}
