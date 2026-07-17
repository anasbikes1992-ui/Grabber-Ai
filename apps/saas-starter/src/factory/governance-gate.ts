/**
 * Milestone 4 — Factory Integration gate.
 * Commercial client builds require Delivery Governance approval + deposit.
 * Golden references and internal catalog builds may skip the gate.
 */
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export type FactoryHandoff = {
  ok: true;
  engagement_id: string;
  client_name: string;
  governance_stage: string;
  factory_eligible: true;
  project_dna: Record<string, unknown>;
  fingerprint: string;
  commercial_refs: {
    proposal_id?: string;
    sow_id?: string;
  };
  approvals: Record<string, unknown>;
};

export type GovernanceGateResult =
  | { required: false; reason: string }
  | { required: true; handoff: FactoryHandoff };

function monorepoRoot(cwd = process.cwd()) {
  const candidates = [
    join(cwd, "..", ".."),
    join(cwd, ".."),
    cwd,
  ];
  for (const c of candidates) {
    if (existsSync(join(c, "packages", "enterprise", "src", "index.js"))) {
      return c;
    }
  }
  return join(cwd, "..", "..");
}

async function loadEnterprise(cwd = process.cwd()) {
  const root = monorepoRoot(cwd);
  const modPath = join(root, "packages", "enterprise", "src", "index.js");
  if (!existsSync(modPath)) {
    throw new Error("enterprise package missing — cannot enforce factory gate");
  }
  return import(pathToFileURL(modPath).href);
}

/**
 * Enforce factory eligibility for commercial engagement builds.
 * Pass skipGovernance for golden references / catalog demos.
 */
export async function assertFactoryGovernance(options: {
  engagementId?: string | null;
  skipGovernance?: boolean;
  cwd?: string;
}): Promise<GovernanceGateResult> {
  const cwd = options.cwd ?? process.cwd();

  if (options.skipGovernance) {
    return { required: false, reason: "skipGovernance (reference/catalog path)" };
  }

  if (!options.engagementId) {
    return {
      required: false,
      reason: "no engagement_id — internal/catalog product path",
    };
  }

  if (!process.env.GRABBER_ENTERPRISE_DIR) {
    process.env.GRABBER_ENTERPRISE_DIR = join(
      monorepoRoot(cwd),
      ".grabber",
      "enterprise",
    );
  }

  const api = await loadEnterprise(cwd);
  const handoff = api.getFactoryHandoff(
    options.engagementId,
    monorepoRoot(cwd),
  ) as FactoryHandoff;

  if (!handoff?.factory_eligible || !handoff.project_dna) {
    throw new Error(
      `Factory gate denied for engagement ${options.engagementId}: not factory eligible`,
    );
  }

  return { required: true, handoff };
}

/**
 * Import approved DNA from Business OS into a product-shaped DNA blob.
 */
export async function handoffToProductDna(
  engagementId: string,
  cwd = process.cwd(),
) {
  const gate = await assertFactoryGovernance({ engagementId, cwd });
  if (!gate.required) {
    throw new Error("expected gated handoff");
  }
  const dna = gate.handoff.project_dna as {
    product?: { name?: string; blueprint?: string; type?: string };
    project?: { name?: string; type?: string };
    modules?: string[];
    integrations?: string[];
    governance?: { engagement_id?: string };
  };

  return {
    handoff: gate.handoff,
    name:
      dna.product?.name ||
      dna.project?.name ||
      `engagement-${engagementId.slice(0, 8)}`,
    blueprint:
      dna.product?.blueprint ||
      dna.product?.type ||
      dna.project?.type ||
      "saas",
    dna: {
      ...dna,
      governance: {
        ...(dna.governance || {}),
        engagement_id: engagementId,
        factory_fingerprint: gate.handoff.fingerprint,
        commercial_refs: gate.handoff.commercial_refs,
      },
    },
  };
}

/** Sync helper for environments that only have require (tests). */
export function monorepoRootSync(cwd = process.cwd()) {
  return monorepoRoot(cwd);
}

// keep createRequire available for potential CJS interop tests
void createRequire;
