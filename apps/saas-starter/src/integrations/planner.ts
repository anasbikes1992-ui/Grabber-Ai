import type {
  DnaIntegrationView,
  IntegrationDecision,
  IntegrationProvider,
} from "./types";

/**
 * Integration Planner — DNA decides which external systems apply.
 * Connectors stay thin; this layer understands Product DNA.
 */
export function planIntegrations(dna: DnaIntegrationView): IntegrationDecision[] {
  const integrations = new Set(
    (dna.integrations ?? []).map((i) => i.toLowerCase()),
  );
  const modules = new Set(
    (dna.modules ?? dna.architecture?.modules ?? []).map((m) =>
      m.toLowerCase(),
    ),
  );
  const deploy = (
    dna.deployment?.provider ??
    "vercel"
  ).toLowerCase();
  const type = (dna.project.type ?? dna.project.template ?? "saas").toLowerCase();

  const needsPayments =
    integrations.has("stripe") ||
    modules.has("payments") ||
    modules.has("billing") ||
    /\b(booking|marketplace|ecommerce)\b/i.test(type);

  const needsSupabase =
    integrations.has("supabase") ||
    modules.has("authentication") ||
    modules.has("users") ||
    true; // SaaS Starter default backend

  const needsGithub =
    integrations.has("github") || true; // always for code delivery

  const needsVercel =
    deploy === "vercel" ||
    integrations.has("vercel") ||
    true; // Sprint 4 default deploy target

  const decisions: IntegrationDecision[] = [
    {
      provider: "github",
      include: needsGithub,
      reason: needsGithub
        ? "DNA requires source control and delivery (repo, PR, secrets)."
        : "GitHub not selected.",
      priority: 10,
    },
    {
      provider: "supabase",
      include: needsSupabase,
      reason: needsSupabase
        ? "DNA stack uses Supabase for auth/database/storage."
        : "Supabase not selected.",
      priority: 20,
    },
    {
      provider: "stripe",
      include: needsPayments,
      reason: needsPayments
        ? "DNA includes payments/billing or a paid domain product."
        : "No payments/billing modules — Stripe skipped.",
      priority: 30,
    },
    {
      provider: "vercel",
      include: needsVercel,
      reason: needsVercel
        ? `Deployment provider is ${deploy}; Vercel publishes the production URL.`
        : "Non-Vercel deployment target.",
      priority: 40,
    },
  ];

  return decisions.sort((a, b) => a.priority - b.priority);
}

export function selectedProviders(
  decisions: IntegrationDecision[],
): IntegrationProvider[] {
  return decisions.filter((d) => d.include).map((d) => d.provider);
}
