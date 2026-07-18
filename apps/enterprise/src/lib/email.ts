/**
 * Transactional email via Resend (REST, no SDK dependency).
 * Env: RESEND_API_KEY (required) · EMAIL_FROM (verified sender, e.g.
 * "Grabber Studio <hello@yourdomain.com>") · OWNER_EMAIL (notifications).
 * All sends are best-effort: failures log and never break the caller.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || "Grabber Studio <onboarding@resend.dev>";
}

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const wrap = (title: string, body: string) => `
  <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;line-height:1.55">
    <p style="display:inline-block;background:#e0f2fe;color:#0369a1;padding:4px 10px;border-radius:999px;font-size:12px;margin:0 0 12px">Grabber Studio</p>
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    ${body}
    <p style="margin-top:28px;font-size:12px;color:#94a3b8">Grabber Studio — AI-native consulting &amp; delivery</p>
  </div>`;

export async function sendDepositReceipt(input: {
  to: string;
  clientName: string;
  amount: number;
  currency: string;
  engagementId: string;
}): Promise<void> {
  const amt = `${input.currency.toUpperCase()} ${input.amount.toLocaleString()}`;
  const r = await sendEmail({
    to: input.to,
    subject: `Deposit received — ${input.clientName}`,
    html: wrap(
      "Your deposit is confirmed",
      `<p>Thank you — we've received your deposit of <strong>${amt}</strong> for <strong>${input.clientName}</strong>.</p>
       <p>Your proposal is now approved and delivery is being scheduled. Track progress any time in your client portal.</p>
       <p style="font-size:13px;color:#64748b">Reference: ${input.engagementId}</p>`,
    ),
  });
  if (!r.ok) console.warn(JSON.stringify({ scope: "email", event: "receipt_failed", error: r.error }));
}

export async function sendBlueprintEmail(input: {
  to: string;
  clientName: string;
  briefingHtml: string;
}): Promise<void> {
  const r = await sendEmail({
    to: input.to,
    subject: `Your business blueprint is ready — ${input.clientName}`,
    html: input.briefingHtml,
  });
  if (!r.ok) console.warn(JSON.stringify({ scope: "email", event: "blueprint_failed", error: r.error }));
}

export async function sendPortalReadyEmail(input: {
  to: string;
  portalUrl: string;
}): Promise<void> {
  const r = await sendEmail({
    to: input.to,
    subject: "Your Grabber Studio client portal is ready",
    html: wrap(
      "Your portal is ready",
      `<p>Your consulting engagement is now linked to your account.</p>
       <p>Sign in any time to see project status, documents, proposals, and payments:</p>
       <p><a href="${input.portalUrl}" style="display:inline-block;background:#0284c7;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">Open your portal</a></p>`,
    ),
  });
  if (!r.ok) console.warn(JSON.stringify({ scope: "email", event: "portal_ready_failed", error: r.error }));
}

export async function notifyOwnerLead(input: {
  clientName: string;
  industry?: string;
  contactEmail?: string;
  source: string;
}): Promise<void> {
  const owner = (process.env.OWNER_EMAIL ?? "").split(",")[0]?.trim();
  if (!owner) return;
  const r = await sendEmail({
    to: owner,
    subject: `🔔 New lead: ${input.clientName}`,
    html: wrap(
      "A new lead just arrived",
      `<p><strong>${input.clientName}</strong>${input.industry ? ` · ${input.industry}` : ""}</p>
       ${input.contactEmail ? `<p>Contact: ${input.contactEmail}</p>` : ""}
       <p style="font-size:13px;color:#64748b">Source: ${input.source}</p>`,
    ),
  });
  if (!r.ok) console.warn(JSON.stringify({ scope: "email", event: "lead_notify_failed", error: r.error }));
}

export async function notifyOwnerDeposit(input: {
  clientName: string;
  amount: number;
  currency: string;
  engagementId: string;
}): Promise<void> {
  const owner = (process.env.OWNER_EMAIL ?? "").split(",")[0]?.trim();
  if (!owner) return;
  const amt = `${input.currency.toUpperCase()} ${input.amount.toLocaleString()}`;
  const r = await sendEmail({
    to: owner,
    subject: `💰 Deposit paid: ${input.clientName} (${amt})`,
    html: wrap(
      "A client just paid their deposit",
      `<p><strong>${input.clientName}</strong> paid <strong>${amt}</strong>.</p>
       <p>Governance has advanced — open the console to schedule delivery.</p>
       <p style="font-size:13px;color:#64748b">Engagement: ${input.engagementId}</p>`,
    ),
  });
  if (!r.ok) console.warn(JSON.stringify({ scope: "email", event: "owner_notify_failed", error: r.error }));
}
