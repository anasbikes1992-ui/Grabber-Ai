/** Sprint 4 — Integration Layer (DNA-driven, not raw connectors). */

export type IntegrationProvider =
  | "github"
  | "supabase"
  | "stripe"
  | "vercel";

export type IntegrationDecision = {
  provider: IntegrationProvider;
  include: boolean;
  reason: string;
  priority: number;
};

export type IntegrationStep = {
  id: string;
  description: string;
  status: "planned" | "skipped" | "dry_run" | "executed" | "failed";
  detail?: Record<string, unknown>;
};

export type IntegrationPlan = {
  provider: IntegrationProvider;
  include: boolean;
  reason: string;
  steps: IntegrationStep[];
  requires_secrets: string[];
  dry_run: boolean;
};

export type IntegrationRunResult = {
  provider: IntegrationProvider;
  include: boolean;
  dry_run: boolean;
  steps: IntegrationStep[];
  outputs: Record<string, unknown>;
  error?: string;
};

export type IntegrationLayerResult = {
  ok: boolean;
  decisions: IntegrationDecision[];
  plans: IntegrationPlan[];
  results: IntegrationRunResult[];
  /** Ordered post-build workflow for the customer journey */
  workflow: string[];
  production_url?: string;
  errors: string[];
};

/** Minimal DNA surface the planner needs (rich or core-compatible). */
export type DnaIntegrationView = {
  project: {
    name: string;
    type?: string;
    industry?: string;
    template?: string;
  };
  integrations?: string[];
  modules?: string[];
  deployment?: { provider?: string };
  quality?: { security?: string };
  // core envelope fallback
  architecture?: { modules?: string[] };
  deployment_targets?: { environments?: string[] };
};
