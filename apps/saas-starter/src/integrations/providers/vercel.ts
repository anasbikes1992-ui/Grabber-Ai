import type { DnaIntegrationView, IntegrationPlan, IntegrationRunResult } from "../types";

export function planVercel(dna: DnaIntegrationView): IntegrationPlan {
  return {
    provider: "vercel",
    include: true,
    reason: "Production deployment URL",
    requires_secrets: ["VERCEL_TOKEN"],
    dry_run: true,
    steps: [
      {
        id: "create_project",
        description: `Create Vercel project ${dna.project.name}`,
        status: "planned",
      },
      {
        id: "configure_env",
        description: "Set Supabase + Stripe env vars on Vercel",
        status: "planned",
      },
      {
        id: "connect_github",
        description: "Connect GitHub repository",
        status: "planned",
      },
      {
        id: "trigger_deployment",
        description: "Trigger production deployment",
        status: "planned",
      },
      {
        id: "return_production_url",
        description: "Return production URL to customer",
        status: "planned",
      },
    ],
  };
}

export function runVercelForDna(
  dna: DnaIntegrationView,
  opts: { execute?: boolean } = {},
): IntegrationRunResult {
  const plan = planVercel(dna);
  const execute =
    opts.execute === true && Boolean(process.env.VERCEL_TOKEN?.trim());
  const production_url = `https://${dna.project.name}.vercel.app`;

  return {
    provider: "vercel",
    include: true,
    dry_run: !execute,
    steps: plan.steps.map((s) => ({
      ...s,
      status: execute ? "executed" : "dry_run",
      detail: {
        ...s.detail,
        mode: execute ? "live" : "dry_run",
        ...(s.id === "return_production_url" ? { url: production_url } : {}),
      },
    })),
    outputs: {
      production_url,
      project: dna.project.name,
    },
  };
}
