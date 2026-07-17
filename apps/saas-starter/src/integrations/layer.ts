import { planIntegrations } from "./planner";
import { runGitHubForDna } from "./providers/github";
import { runSupabaseForDna } from "./providers/supabase";
import { runStripeForDna } from "./providers/stripe";
import { runVercelForDna } from "./providers/vercel";
import type {
  DnaIntegrationView,
  IntegrationLayerResult,
  IntegrationPlan,
  IntegrationRunResult,
} from "./types";
import { planGitHub } from "./providers/github";
import { planSupabase } from "./providers/supabase";
import { planStripe } from "./providers/stripe";
import { planVercel } from "./providers/vercel";

/**
 * Integration Layer entrypoint.
 * DNA → Integration Planner → provider plans/runs → production URL path.
 */
export function runIntegrationLayer(
  dna: DnaIntegrationView,
  opts: { execute?: boolean } = {},
): IntegrationLayerResult {
  const decisions = planIntegrations(dna);
  const plans: IntegrationPlan[] = [];
  const results: IntegrationRunResult[] = [];
  const errors: string[] = [];

  for (const d of decisions) {
    if (!d.include) {
      plans.push({
        provider: d.provider,
        include: false,
        reason: d.reason,
        steps: [
          {
            id: "skip",
            description: d.reason,
            status: "skipped",
          },
        ],
        requires_secrets: [],
        dry_run: true,
      });
      results.push({
        provider: d.provider,
        include: false,
        dry_run: true,
        steps: [
          { id: "skip", description: d.reason, status: "skipped" },
        ],
        outputs: {},
      });
      continue;
    }

    try {
      switch (d.provider) {
        case "github":
          plans.push(planGitHub(dna));
          results.push(runGitHubForDna(dna, opts));
          break;
        case "supabase":
          plans.push(planSupabase(dna));
          results.push(runSupabaseForDna(dna, opts));
          break;
        case "stripe":
          plans.push(planStripe(dna));
          results.push(runStripeForDna(dna, opts));
          break;
        case "vercel":
          plans.push(planVercel(dna));
          results.push(runVercelForDna(dna, opts));
          break;
      }
    } catch (e) {
      errors.push(
        `${d.provider}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const vercel = results.find((r) => r.provider === "vercel" && r.include);
  const production_url =
    typeof vercel?.outputs.production_url === "string"
      ? vercel.outputs.production_url
      : undefined;

  const included = decisions.filter((d) => d.include).map((d) => d.provider);

  return {
    ok: errors.length === 0,
    decisions,
    plans,
    results,
    workflow: [
      "client",
      "discovery",
      "project_dna",
      "review",
      "approve",
      "grabber_core",
      "build",
      ...included,
      "production_url",
    ],
    production_url,
    errors,
  };
}

/** Normalize rich intake DNA to integration view. */
export function dnaToIntegrationView(rich: {
  project: { name: string; type?: string; industry?: string; template?: string };
  integrations?: string[];
  modules?: string[];
  deployment?: { provider?: string };
  quality?: { security?: string };
}): DnaIntegrationView {
  return {
    project: rich.project,
    integrations: rich.integrations,
    modules: rich.modules,
    deployment: rich.deployment,
    quality: rich.quality,
  };
}
