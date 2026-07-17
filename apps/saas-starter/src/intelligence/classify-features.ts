import type { FeatureClassification, Requirements } from "./types";

const MODULE_RULES: {
  test: RegExp;
  module: string;
  feature: string;
  category: FeatureClassification["features"][0]["category"];
  priority: "must" | "should" | "may";
  integration?: string;
}[] = [
  {
    test: /\b(auth|login|sign\s*up|rbac|role)\b/i,
    module: "users",
    feature: "Authentication & RBAC",
    category: "auth",
    priority: "must",
  },
  {
    test: /\b(tenant|multi-tenant|workspace|org)\b/i,
    module: "tenants",
    feature: "Multi-tenant isolation",
    category: "core",
    priority: "must",
  },
  {
    test: /\b(bill|pay|stripe|subscription|plan)\b/i,
    module: "billing",
    feature: "Billing & plans",
    category: "billing",
    priority: "must",
    integration: "stripe",
  },
  {
    test: /\b(crm|deal|pipeline|contact|lead)\b/i,
    module: "deals",
    feature: "CRM pipeline",
    category: "workflow",
    priority: "must",
  },
  {
    test: /\b(book|schedul|calendar|availability|appointment)\b/i,
    module: "bookings",
    feature: "Booking & availability",
    category: "workflow",
    priority: "must",
  },
  {
    test: /\b(market|catalog|inventory|order|cart)\b/i,
    module: "orders",
    feature: "Orders & catalog",
    category: "workflow",
    priority: "must",
  },
  {
    test: /\b(notif|email|sms|whatsapp)\b/i,
    module: "notifications",
    feature: "Notifications",
    category: "ops",
    priority: "should",
  },
  {
    test: /\b(file|upload|storage|asset)\b/i,
    module: "files",
    feature: "File storage",
    category: "content",
    priority: "should",
    integration: "supabase",
  },
  {
    test: /\b(search)\b/i,
    module: "search",
    feature: "Search",
    category: "core",
    priority: "should",
  },
];

/**
 * Feature classification + module selection from requirements text.
 */
export function classifyFeatures(req: Requirements): FeatureClassification {
  const blob = [
    ...req.goals,
    ...req.critical_flows,
    ...req.acceptance.map((a) => a.statement),
  ].join(" ");

  const modules = new Set<string>(["core", "users"]);
  const integrations = new Set<string>(["supabase", "github"]);
  const features: FeatureClassification["features"] = [
    {
      id: "f-core",
      label: "Core application shell",
      category: "core",
      priority: "must",
    },
    {
      id: "f-users",
      label: "User accounts",
      category: "auth",
      priority: "must",
    },
  ];

  let i = 0;
  for (const rule of MODULE_RULES) {
    if (rule.test.test(blob)) {
      modules.add(rule.module);
      if (rule.integration) integrations.add(rule.integration);
      features.push({
        id: `f-${++i}-${rule.module}`,
        label: rule.feature,
        category: rule.category,
        priority: rule.priority,
      });
    }
  }

  // SaaS baseline always includes tenants + billing-ready module
  modules.add("tenants");
  modules.add("billing");

  return {
    features,
    modules: [...modules],
    integrations: [...integrations],
  };
}
