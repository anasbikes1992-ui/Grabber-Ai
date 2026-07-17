import { createHash } from "node:crypto";
import type {
  ClientRequest,
  FeatureClassification,
  ProjectDnaDocument,
  Requirements,
} from "./types";

export function generateProjectDna(args: {
  request: ClientRequest;
  requirements: Requirements;
  classification: FeatureClassification;
  layerVersion: string;
  promptVersions: Record<string, string>;
}): ProjectDnaDocument {
  const { request, requirements, classification, layerVersion, promptVersions } =
    args;

  const name =
    request.name_hint?.trim() ||
    slugify(request.text.split(/\s+/).slice(0, 4).join(" ")) ||
    "saas-product";

  const industry =
    request.industry ||
    inferIndustry(request.text, classification) ||
    "saas";

  const business_model =
    request.business_model ||
    (/\bmarketplace\b/i.test(request.text)
      ? "two-sided-marketplace"
      : "b2b-saas");

  const source_request_hash = createHash("sha256")
    .update(request.text)
    .digest("hex")
    .slice(0, 16);

  return {
    project: {
      name,
      template: "saas-starter",
      industry,
      business_model,
      users: requirements.users,
      goals: requirements.goals,
      constraints: {
        must: [
          "derive every artifact from this DNA",
          "submit builder jobs only to Grabber Core Product Factory",
        ],
        should: ["Next.js + Supabase stack", "multi-tenant isolation"],
        may: ["defer advanced analytics"],
        must_not: [
          "implement a second orchestrator in the product",
          "invent features not classified as must/should",
        ],
        assumptions: [
          "Product Intelligence Layer is product-side configuration",
          "Grabber Core owns execution",
        ],
        unknowns: requirements.unknowns,
        risks: requirements.risks,
      },
      integrations: classification.integrations,
      architecture: {
        style: "modular-monolith",
        modules: classification.modules,
      },
      stack: "crud-dashboard (Next.js + Supabase)",
      conventions: {
        db_naming: "plural",
        api_envelope: "data/error+trace_id",
        breakpoints: ["sm", "md", "lg"],
      },
      security_level: /\b(elevated|hipaa|payment)\b/i.test(request.text)
        ? "elevated"
        : "standard",
      authorization: {
        model: "rbac",
        roles: [...new Set(requirements.users.map((u) => u.role))],
      },
      accessibility_level: "WCAG-2.1-AA",
      performance_targets: {
        lcp_ms: 2500,
        inp_ms: 200,
        api_p95_ms: 400,
      },
      data: {
        retention: "account-lifetime",
        regulated: /\b(hipaa|phi|pci)\b/i.test(request.text),
      },
      deployment_targets: {
        environments: ["development", "staging", "production"],
        uptime_target: "99.9%",
        backup_schedule: "daily",
      },
      critical_flows: requirements.critical_flows,
      standards_version: "stds-1.0.0",
      decision_registry: ["EDR-007"],
      intelligence: {
        layer_version: layerVersion,
        prompt_versions: promptVersions,
        source_request_hash,
      },
    },
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function inferIndustry(
  text: string,
  classification: FeatureClassification,
): string {
  if (classification.modules.includes("bookings")) return "booking";
  if (classification.modules.includes("deals")) return "sales";
  if (classification.modules.includes("orders")) return "marketplace";
  if (/\beducation|course|learn\b/i.test(text)) return "education";
  return "saas";
}
