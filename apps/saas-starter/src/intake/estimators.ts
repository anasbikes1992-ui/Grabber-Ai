import type { BuilderJob, CostEstimate, RichProjectDna } from "./types";

/** Deterministic cost envelope for review (not a quote). */
export function estimateCost(
  dna: RichProjectDna,
  jobs: BuilderJob[],
): CostEstimate {
  const moduleCount = dna.modules.length;
  const flowCount = dna.project.critical_flows.length;
  const integrationCount = dna.integrations.length;

  const builders = jobs.length || 11;
  const estimated_tokens =
    800 * builders + 400 * moduleCount + 200 * flowCount + 150 * integrationCount;
  const estimated_cost_usd = Number(((estimated_tokens / 1000) * 0.01).toFixed(4));
  const estimated_duration_minutes = Math.max(
    5,
    Math.round(builders * 0.8 + moduleCount * 1.5 + integrationCount),
  );

  const notes: string[] = [
    "Estimate is deterministic for planning — live model rates vary.",
  ];
  if (dna.quality.security === "high" || dna.quality.security === "elevated") {
    notes.push("Elevated security increases review surface.");
  }
  if (dna.data.regulated) {
    notes.push("Regulated data requires extended discovery.");
  }

  return {
    currency: "USD",
    estimated_tokens,
    estimated_cost_usd,
    estimated_duration_minutes,
    builders,
    notes,
  };
}
