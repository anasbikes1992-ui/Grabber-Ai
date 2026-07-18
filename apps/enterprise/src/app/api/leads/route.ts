import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";
import {
  createLead,
  isSupabasePersistenceEnabled,
  listLeads as listSupabaseLeads,
} from "@/lib/production/leads";
import { publishDomainEvent } from "@/lib/production/event-bus";
import { log } from "@/lib/production/logger";
import { checkRateLimit } from "@/lib/production/rate-limit";
import { notifyOwnerLead } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public-friendly lead / booking intake for website funnel. */
export async function POST(req: Request) {
  try {
    const requestId = req.headers.get("x-request-id") || "n/a";
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const throttle = checkRateLimit(`leads:${ip}`, 30, 60 * 60 * 1000);
    if (!throttle.allowed) {
      return jsonErr("rate limit exceeded", 429);
    }

    const body = await req.json();
    const useSupabase = isSupabasePersistenceEnabled();
    let api: Awaited<ReturnType<typeof ent>> | null = null;
    let cwd = "";

    const normalize = (value: unknown, max: number) =>
      String(value || "")
        .trim()
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .slice(0, max);

    const name = normalize(body.name || body.company, 200);
    if (!name) return jsonErr("name or company required");

    const email = normalize(body.email, 254);
    const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return jsonErr("invalid email", 400);

    const leadInput = {
      name,
      email,
      source: normalize(body.source || "website", 64) || "website",
      industry: normalize(body.industry || "saas", 64) || "saas",
      score: body.score || 60,
      phone: normalize(body.phone, 64),
      preferred_time: normalize(body.preferred_time, 128),
      message: normalize(body.message || body.story, 4000),
      company: normalize(body.company || name, 200),
    };

    let lead;
    if (useSupabase) {
      try {
        lead = await createLead(leadInput);
      } catch (error) {
        log("warn", {
          event: "leads.persistence.supabase_failed",
          requestId,
          details: { message: error instanceof Error ? error.message : String(error) },
        });
        api = await ent();
        cwd = monorepoCwd();
        lead = api.recordLead(leadInput, cwd);
      }
    } else {
      api = await ent();
      cwd = monorepoCwd();
      lead = api.recordLead(leadInput, cwd);
    }

    await publishDomainEvent({
      type: "LeadCreated",
      subject: lead.id,
      payload: {
        source: lead.source,
        industry: lead.industry,
        company: lead.company,
      },
      stage: "intake",
    });

    log("info", {
      event: "leads.created",
      requestId,
      details: {
        id: lead.id,
        source: lead.source,
        supabase: useSupabase,
      },
    });

    void notifyOwnerLead({
      clientName: name,
      industry: leadInput.industry,
      contactEmail: email || undefined,
      source: leadInput.source,
    });

    // Optionally start consulting engagement for “start discovery now”
    let engagement = null;
    if (body.start_discovery && (body.story || body.message)) {
      if (!api) {
        api = await ent();
        cwd = monorepoCwd();
      }
      engagement = api.startConsultation(
        {
          name,
          story: body.story || body.message,
          industry: body.industry,
          contact_email: body.email,
        },
        cwd,
      );
    }

    return jsonOk({ lead, engagement }, 201);
  } catch (e) {
    log("error", {
      event: "leads.create_failed",
      details: { message: e instanceof Error ? e.message : String(e) },
    });
    return jsonErr(e, 500);
  }
}

export async function GET() {
  try {
    if (isSupabasePersistenceEnabled()) {
      try {
        return jsonOk({ leads: await listSupabaseLeads() });
      } catch (error) {
        log("warn", {
          event: "leads.list.supabase_failed",
          details: { message: error instanceof Error ? error.message : String(error) },
        });
      }
    }

    const api = await ent();
    return jsonOk({ leads: api.listLeads(monorepoCwd()) });
  } catch (e) {
    return jsonErr(e, 500);
  }
}
