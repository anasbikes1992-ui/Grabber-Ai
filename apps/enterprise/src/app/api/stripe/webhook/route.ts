import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { recordDeposit } from "@/lib/deposits";
import { notifyOwnerDeposit, sendDepositReceipt } from "@/lib/email";
import { ent, monorepoCwd } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Best-effort advance of the engine governance (works on a warm instance;
 * Supabase remains the durable record of the paid deposit). */
async function advanceEngineGovernance(engagementId: string) {
  try {
    const api = await ent();
    const cwd = monorepoCwd();
    for (const stage of ["client_approval", "deposit_received"] as const) {
      try {
        api.advanceGovernance(engagementId, { stage, actor: "client", notes: "paid online" }, cwd);
      } catch {
        // stage may already be passed / engagement not on this instance — ignore
      }
    }
  } catch {
    // engine unavailable in this invocation — Supabase deposit is the source of truth
  }
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return new Response("payments not configured", { status: 503 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    if (secret && signature) {
      event = stripe.webhooks.constructEvent(raw, signature, secret);
    } else {
      // No webhook secret set: parse without verification (dev only).
      event = JSON.parse(raw) as Stripe.Event;
    }
  } catch (e) {
    return new Response(`signature verification failed: ${e instanceof Error ? e.message : e}`, {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};
    const engagementId = meta.engagement_id;
    if (engagementId) {
      try {
        await recordDeposit({
          engagement_id: engagementId,
          client_name: meta.client_name || null,
          amount: Number(meta.deposit_amount) || (session.amount_total ?? 0) / 100,
          currency: meta.currency || session.currency || "usd",
          stripe_session_id: session.id,
        });
      } catch (e) {
        // Log and still return 200 so Stripe does not retry forever on a
        // storage error; surfaced via monitoring.
        console.error(JSON.stringify({ scope: "stripe.webhook", event: "record_failed", error: String(e) }));
      }
      await advanceEngineGovernance(engagementId);

      // Best-effort notifications (no-ops when RESEND_API_KEY unset).
      const amount = Number(meta.deposit_amount) || (session.amount_total ?? 0) / 100;
      const currency = meta.currency || session.currency || "usd";
      const clientEmail = session.customer_details?.email || session.customer_email;
      if (clientEmail) {
        await sendDepositReceipt({
          to: clientEmail,
          clientName: meta.client_name || "your project",
          amount,
          currency,
          engagementId,
        });
      }
      await notifyOwnerDeposit({
        clientName: meta.client_name || "Unknown client",
        amount,
        currency,
        engagementId,
      });
    }
  }

  return Response.json({ received: true });
}
