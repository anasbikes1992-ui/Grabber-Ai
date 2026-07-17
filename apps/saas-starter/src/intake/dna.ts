import { createHash } from "node:crypto";
import type { FeatureClassification, Requirements } from "@/intelligence/types";
import { domainModuleBoosts, type DomainId } from "./domain";
import { scoreDnaQuality } from "./validators";
import type {
  CoreCompatibleDna,
  IntakeInput,
  RichProjectDna,
} from "./types";

const INTAKE_VERSION = "0.3.0";

export function buildRichDna(args: {
  input: IntakeInput;
  text: string;
  requirements: Requirements;
  classification: FeatureClassification;
  domain: DomainId;
  industry: string;
  type: string;
  layerVersion: string;
}): RichProjectDna {
  const {
    input,
    text,
    requirements,
    classification,
    domain,
    industry,
    type,
    layerVersion,
  } = args;

  const name =
    input.name_hint?.trim() ||
    slugify(text.split(/\s+/).slice(0, 4).join(" ")) ||
    "product";

  const modules = unique([
    ...classification.modules.map(normalizeModule),
    ...domainModuleBoosts(domain).map(normalizeModule),
  ]);

  const integrations = unique([
    ...classification.integrations,
    "supabase",
    "github",
    ...(domain === "booking" || domain === "marketplace" || /\bpay|bill|stripe\b/i.test(text)
      ? ["stripe"]
      : []),
  ]);

  const security: RichProjectDna["quality"]["security"] =
    domain === "healthcare" || /\b(pci|hipaa|payment)\b/i.test(text)
      ? "elevated"
      : domain === "booking" || domain === "marketplace"
        ? "high"
        : "standard";

  const base = {
    project: {
      name,
      type,
      industry: input.industry || industry,
      target: "web" as const,
      template: domain === "saas" ? "saas-starter" : domain,
      business_model:
        input.business_model ||
        (domain === "marketplace"
          ? "two-sided-marketplace"
          : domain === "booking"
            ? "services"
            : "b2b-saas"),
      goals: requirements.goals,
      critical_flows: requirements.critical_flows,
      standards_version: "stds-1.0.0",
      decision_registry: ["EDR-007"],
    },
    business: {
      users: requirements.users.map((u) => u.role),
      user_goals: requirements.users,
      value_proposition: requirements.goals[0] ?? text.slice(0, 140),
    },
    modules,
    features: classification.features,
    integrations,
    architecture: {
      style: "modular-monolith",
      stack: "crud-dashboard (Next.js + Supabase)",
      conventions: {
        db_naming: "plural",
        api_envelope: "data/error+trace_id",
        breakpoints: ["sm", "md", "lg"],
      },
    },
    deployment: {
      provider: "vercel",
      environments: ["development", "staging", "production"],
      uptime_target: "99.9%",
      backup_schedule: "daily",
    },
    quality: {
      security,
      testing: "required" as const,
      accessibility: "WCAG-2.1-AA",
    },
    constraints: {
      must: [
        "derive every artifact from this DNA",
        "human review before Core submit when confidence is low",
      ],
      should: ["prefer existing SaaS Starter modules", "thin connectors only"],
      may: ["defer secondary analytics"],
      must_not: [
        "implement product-side orchestrator",
        "submit to Core without ready_for_build",
      ],
      assumptions: [
        "Intake pipeline is product-side",
        "Grabber Core executes builders",
      ],
      unknowns: requirements.unknowns,
      risks: requirements.risks,
    },
    authorization: {
      model: "rbac",
      roles: unique(requirements.users.map((u) => u.role)),
    },
    data: {
      retention: "account-lifetime",
      regulated: domain === "healthcare" || /\bhipaa|phi\b/i.test(text),
    },
    performance_targets: {
      lcp_ms: 2500,
      inp_ms: 200,
      api_p95_ms: 400,
    },
  };

  const quality = scoreDnaQuality(input, base, {
    unknowns: requirements.unknowns,
    risks: requirements.risks,
    text,
  });

  const hash = createHash("sha256").update(text).digest("hex").slice(0, 16);

  return {
    ...base,
    intelligence: {
      layer_version: layerVersion,
      intake_version: INTAKE_VERSION,
      source_request_hash: hash,
      quality,
    },
  };
}

/** Flatten rich DNA into Core Product Factory envelope. */
export function toCoreCompatibleDna(rich: RichProjectDna): CoreCompatibleDna {
  return {
    project: {
      name: rich.project.name,
      template: rich.project.template,
      industry: rich.project.industry,
      business_model: rich.project.business_model,
      users: rich.business.user_goals,
      goals: rich.project.goals,
      constraints: rich.constraints,
      integrations: rich.integrations,
      architecture: {
        style: rich.architecture.style,
        modules: rich.modules,
      },
      stack: rich.architecture.stack,
      conventions: rich.architecture.conventions,
      security_level:
        rich.quality.security === "elevated"
          ? "elevated"
          : rich.quality.security === "high"
            ? "elevated"
            : "standard",
      authorization: rich.authorization,
      accessibility_level: rich.quality.accessibility,
      performance_targets: rich.performance_targets,
      data: rich.data,
      deployment_targets: {
        environments: rich.deployment.environments,
        uptime_target: rich.deployment.uptime_target,
        backup_schedule: rich.deployment.backup_schedule,
      },
      critical_flows: rich.project.critical_flows,
      standards_version: rich.project.standards_version,
      decision_registry: rich.project.decision_registry,
      type: rich.project.type,
      target: rich.project.target,
      intelligence: {
        intake_version: rich.intelligence.intake_version,
        quality: rich.intelligence.quality,
        source_request_hash: rich.intelligence.source_request_hash,
      },
    },
  };
}

function normalizeModule(m: string): string {
  // Align with Factory Registry ids (Sprint 5)
  const map: Record<string, string> = {
    users: "authentication",
    auth: "authentication",
    core: "authentication",
    tenants: "teams",
    tenant: "teams",
    billing: "billing",
    payments: "payments",
    bookings: "booking",
    booking: "booking",
    calendar: "calendar",
    deals: "crm",
    contacts: "customers",
    companies: "customers",
    catalog: "products",
    stock: "inventory",
  };
  return map[m] ?? m;
}

function unique(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export { INTAKE_VERSION };
