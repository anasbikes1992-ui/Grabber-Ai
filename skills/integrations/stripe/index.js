// skill.integration.stripe — production-shaped actions (EDR-007)
export const actions = {
  describe: async () => ({
    id: 'skill.integration.stripe',
    capabilities: ['int.stripe', 'payments', 'webhooks'],
  }),

  planCheckout: async (args = {}) => {
    const { amount_cents, currency = 'usd', mode = 'payment' } = args;
    if (!amount_cents) return { ok: false, error: 'amount_cents required' };
    return {
      ok: true,
      dryRun: true,
      plan: {
        mode,
        line_items: [{ amount: amount_cents, currency, quantity: 1 }],
        webhook_events: ['checkout.session.completed', 'payment_intent.succeeded'],
      },
    };
  },

  planConnectPayout: async (args = {}) => ({
    ok: true,
    dryRun: true,
    plan: {
      type: 'express',
      seller_id: args.seller_id ?? null,
      note: 'marketplace seller payouts',
    },
  }),
};

export async function initialize() {
  return { actions };
}
