import type { DnaIntegrationView, IntegrationPlan, IntegrationRunResult } from "../types";

export function planStripe(dna: DnaIntegrationView): IntegrationPlan {
  return {
    provider: "stripe",
    include: true,
    reason: "Payments/billing from DNA",
    requires_secrets: ["STRIPE_SECRET_KEY"],
    dry_run: true,
    steps: [
      {
        id: "create_products",
        description: `Create product catalog for ${dna.project.name}`,
        status: "planned",
        detail: { products: ["starter", "pro"] },
      },
      {
        id: "create_prices",
        description: "Create monthly/yearly prices",
        status: "planned",
      },
      {
        id: "configure_subscriptions",
        description: "Configure subscription modes",
        status: "planned",
      },
      {
        id: "register_webhooks",
        description: "Register checkout.session.completed + invoice.paid",
        status: "planned",
      },
      {
        id: "configure_billing_portal",
        description: "Enable customer billing portal",
        status: "planned",
      },
    ],
  };
}

export function runStripeForDna(
  dna: DnaIntegrationView,
  opts: { execute?: boolean } = {},
): IntegrationRunResult {
  const plan = planStripe(dna);
  const execute =
    opts.execute === true && Boolean(process.env.STRIPE_SECRET_KEY?.trim());

  return {
    provider: "stripe",
    include: true,
    dry_run: !execute,
    steps: plan.steps.map((s) => ({
      ...s,
      status: execute ? "executed" : "dry_run",
      detail: { ...s.detail, mode: execute ? "live" : "dry_run" },
    })),
    outputs: {
      products: ["starter", "pro"],
      webhook_endpoint: `/api/webhooks/stripe`,
      portal: true,
    },
  };
}
