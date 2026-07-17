import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Convert a website/ops lead into a consulting engagement.
 * POST { lead_id, story? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const api = await ent();
    const cwd = monorepoCwd();
    const leads = api.listLeads(cwd);
    const lead = leads.find(
      (l: { id: string }) => l.id === body.lead_id,
    ) as {
      id: string;
      name?: string;
      company?: string;
      email?: string;
      industry?: string;
      message?: string;
      status?: string;
    } | undefined;

    if (!lead) return jsonErr("lead not found", 404);

    const engagement = api.startConsultation(
      {
        name: lead.company || lead.name || "Client",
        industry: mapIndustry(lead.industry),
        contact_email: lead.email || "",
        story:
          body.story ||
          lead.message ||
          `${lead.company || lead.name} requested consultation via website.`,
      },
      cwd,
    );

    // Mark lead converted
    try {
      const storePath = join(
        monorepoCwd(),
        "packages",
        "enterprise",
        "src",
        "store.js",
      );
      if (existsSync(storePath)) {
        const store = await import(
          /* webpackIgnore: true */ pathToFileURL(storePath).href
        );
        store.save(
          "leads",
          {
            ...lead,
            status: "converted",
            engagement_id: engagement.id,
            converted_at: new Date().toISOString(),
          },
          cwd,
        );
      }
    } catch {
      /* non-fatal */
    }

    return jsonOk(
      {
        engagement,
        lead_id: lead.id,
        message: "Lead converted to consulting engagement",
      },
      201,
    );
  } catch (e) {
    return jsonErr(e);
  }
}

function mapIndustry(ind?: string) {
  const i = String(ind || "saas").toLowerCase();
  if (i.includes("textile") || i.includes("wholesale")) {
    return "wholesale-distribution";
  }
  if (i.includes("hotel") || i.includes("hospitality")) return "hospitality";
  return i === "other" ? "saas" : i;
}
