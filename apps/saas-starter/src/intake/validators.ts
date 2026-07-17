import type { DnaQuality, IntakeInput, RichProjectDna } from "./types";

const CONFIDENCE_THRESHOLD = 75;
const COMPLETENESS_THRESHOLD = 70;
const MISSING_INFO_MAX = 40; // lower is better for missing_information inverted score

/**
 * DNA Confidence + Completeness scoring.
 * Low confidence → do not submit to Core; ask clarifications.
 */
export function scoreDnaQuality(
  input: IntakeInput,
  dna: Omit<RichProjectDna, "intelligence"> & {
    intelligence?: Partial<RichProjectDna["intelligence"]>;
  },
  extras: {
    unknowns: string[];
    risks: string[];
    text: string;
  },
): DnaQuality {
  const clarifications_required: string[] = [];
  const warnings: string[] = [];
  const builder_warnings: string[] = [];

  // Business understanding
  let business = 50;
  if (dna.business.users.length >= 2) business += 15;
  if (dna.project.goals.length >= 2) business += 15;
  if (dna.project.critical_flows.length >= 3) business += 10;
  if (dna.project.industry && dna.project.industry !== "generic") business += 10;
  business = clamp(business);

  // Requirements
  let requirements = 40;
  if (dna.features.length >= 3) requirements += 20;
  if (dna.modules.length >= 3) requirements += 15;
  if (dna.integrations.length >= 1) requirements += 10;
  if (dna.architecture.style) requirements += 10;
  if (dna.deployment.provider) requirements += 5;
  requirements = clamp(requirements);

  // Missing information (higher % = more missing = worse)
  let missingPts = 0;
  if (!/\b(auth|login|sign)\b/i.test(extras.text) && !input.clarifications?.auth) {
    missingPts += 15;
    clarifications_required.push(
      "How should users authenticate? (email, OAuth, SSO)",
    );
  }
  if (
    !/\b(pay|billing|stripe|subscription|free)\b/i.test(extras.text) &&
    !input.clarifications?.billing
  ) {
    missingPts += 15;
    clarifications_required.push(
      "Is payment/billing required? Which provider?",
    );
  }
  if (!dna.project.critical_flows.length) {
    missingPts += 20;
    clarifications_required.push("What are the top 3 user journeys?");
  }
  if (extras.unknowns.length) {
    missingPts += Math.min(25, extras.unknowns.length * 8);
  }
  if (!input.clarifications || Object.keys(input.clarifications).length === 0) {
    if (extras.text.length < 80) {
      missingPts += 15;
      clarifications_required.push(
        "Please describe the product in more detail (users, goals, constraints).",
      );
    }
  }
  // Answering clarifications reduces missing score
  if (input.clarifications) {
    const answered = Object.values(input.clarifications).filter((v) =>
      v?.trim(),
    ).length;
    missingPts = Math.max(0, missingPts - answered * 12);
  }

  const missing_information = clamp(missingPts);
  // Invert for "filled" display on some UIs — keep raw missing as percent missing
  const completeness = clamp(
    Math.round(
      (business * 0.35 + requirements * 0.45 + (100 - missing_information) * 0.2),
    ),
  );

  const confidence = clamp(
    Math.round(
      business * 0.3 +
        requirements * 0.35 +
        (100 - missing_information) * 0.25 +
        (dna.modules.length >= 4 ? 10 : 0),
    ),
  );

  if (dna.modules.length < 3) {
    builder_warnings.push("Fewer than 3 modules — builders may produce thin output.");
  }
  if (!dna.integrations.includes("supabase")) {
    warnings.push("No Supabase integration detected — default stack may need override.");
  }
  if (dna.data.regulated) {
    warnings.push("Regulated data domain — elevated security review required.");
  }
  if (extras.risks.length) {
    warnings.push(...extras.risks.map((r) => `Risk: ${r}`));
  }

  const ready_for_build =
    confidence >= CONFIDENCE_THRESHOLD &&
    completeness >= COMPLETENESS_THRESHOLD &&
    missing_information <= MISSING_INFO_MAX &&
    clarifications_required.length === 0;

  if (!ready_for_build && clarifications_required.length === 0) {
    clarifications_required.push(
      "Confidence below threshold — add more product detail or answer open questions.",
    );
  }

  return {
    confidence,
    completeness,
    business_understanding: business,
    requirements,
    missing_information,
    ready_for_build,
    bars: [
      {
        label: "Business Understanding",
        percent: business,
        detail: `${dna.business.users.length} roles, ${dna.project.goals.length} goals`,
      },
      {
        label: "Requirements",
        percent: requirements,
        detail: `${dna.features.length} features, ${dna.modules.length} modules`,
      },
      {
        label: "Missing Information",
        percent: missing_information,
        detail:
          missing_information <= 20
            ? "Low gaps"
            : "Clarify before Core submit",
      },
      {
        label: "Completeness",
        percent: completeness,
      },
      {
        label: "Confidence",
        percent: confidence,
      },
    ],
    clarifications_required: ready_for_build
      ? []
      : [...new Set(clarifications_required)],
    warnings,
    builder_warnings,
  };
}

export function validateRichDna(dna: RichProjectDna): string[] {
  const errors: string[] = [];
  if (!dna.project.name) errors.push("project.name required");
  if (!dna.project.type) errors.push("project.type required");
  if (!dna.modules.length) errors.push("modules required");
  if (!dna.business.users.length) errors.push("business.users required");
  if (!dna.architecture.style) errors.push("architecture.style required");
  if (!dna.deployment.provider) errors.push("deployment.provider required");
  return errors;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export { CONFIDENCE_THRESHOLD, COMPLETENESS_THRESHOLD };
