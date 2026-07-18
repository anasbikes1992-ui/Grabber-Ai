import { appBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { getDeposit, isDepositStoreReady } from "@/lib/deposits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

/** Create a Stripe Checkout session for an engagement's deposit. */
export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return json({ ok: false, error: "Payments are not configured yet." }, 503);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      engagementId?: string;
      amount?: number;
      clientName?: string;
      email?: string;
      currency?: string;
    };
    if (!body.engagementId) return json({ ok: false, error: "engagementId required" }, 400);

    const amount = Math.round(Number(body.amount) || 0);
    if (!Number.isFinite(amount) || amount < 100) {
      return json({ ok: false, error: "A valid deposit amount is required." }, 400);
    }

    const currency = (body.currency || "usd").toLowerCase();
    const base = appBaseUrl();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: body.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount * 100, // dollars → cents
            product_data: {
              name: `Project deposit — ${body.clientName || "Grabber engagement"}`,
              description: "Approves the proposal and unlocks delivery.",
            },
          },
        },
      ],
      metadata: {
        engagement_id: body.engagementId,
        client_name: body.clientName || "",
        deposit_amount: String(amount),
        currency,
      },
      success_url: `${base}/portal?paid=1&engagement=${encodeURIComponent(body.engagementId)}`,
      cancel_url: `${base}/portal?canceled=1`,
    });

    return json({ ok: true, url: session.url });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
}

/** Read whether a deposit is paid (durable, from Supabase). */
export async function GET(req: Request) {
  const engagementId = new URL(req.url).searchParams.get("engagementId") || "";
  if (!engagementId) return json({ ok: false, error: "engagementId required" }, 400);
  if (!isDepositStoreReady()) return json({ ok: true, paid: false, unconfigured: true });
  try {
    const deposit = await getDeposit(engagementId);
    return json({ ok: true, paid: Boolean(deposit), deposit });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
}
