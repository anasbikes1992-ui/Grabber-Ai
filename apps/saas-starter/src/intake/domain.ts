import type { FeatureClassification } from "@/intelligence/types";

export type DomainId =
  | "saas"
  | "booking"
  | "crm"
  | "marketplace"
  | "ecommerce"
  | "inventory"
  | "education"
  | "healthcare"
  | "generic";

export function identifyDomain(
  text: string,
  classification: FeatureClassification,
): { domain: DomainId; industry: string; type: string } {
  if (
    classification.modules.includes("bookings") ||
    /\b(book|schedul|appointment|calendar|availability|hospitality|hotel|salon)\b/i.test(
      text,
    )
  ) {
    return {
      domain: "booking",
      industry: /\b(hotel|hospitality)\b/i.test(text)
        ? "hospitality"
        : "services",
      type: "booking",
    };
  }
  if (
    classification.modules.includes("deals") ||
    /\b(crm|pipeline|lead|sales force)\b/i.test(text)
  ) {
    return { domain: "crm", industry: "sales", type: "crm" };
  }
  if (
    classification.modules.includes("orders") ||
    /\bmarketplace|two-sided\b/i.test(text)
  ) {
    return {
      domain: "marketplace",
      industry: "marketplace",
      type: "marketplace",
    };
  }
  if (/\b(shop|ecommerce|e-commerce|storefront)\b/i.test(text)) {
    return { domain: "ecommerce", industry: "retail", type: "ecommerce" };
  }
  if (/\b(inventory|warehouse|sku)\b/i.test(text)) {
    return { domain: "inventory", industry: "operations", type: "inventory" };
  }
  if (/\b(course|learn|education|school)\b/i.test(text)) {
    return { domain: "education", industry: "education", type: "learning" };
  }
  if (/\b(clinic|patient|hipaa|health)\b/i.test(text)) {
    return {
      domain: "healthcare",
      industry: "healthcare",
      type: "healthcare",
    };
  }
  if (/\b(saas|tenant|subscription|b2b)\b/i.test(text)) {
    return { domain: "saas", industry: "saas", type: "saas" };
  }
  return { domain: "generic", industry: "saas", type: "saas" };
}

/** Domain-specific module boosts so DNA is richer for builders. */
export function domainModuleBoosts(domain: DomainId): string[] {
  // Registry module ids only (Sprint 5 Business Module Assembly)
  switch (domain) {
    case "booking":
      return [
        "authentication",
        "rbac",
        "calendar",
        "booking",
        "payments",
        "notifications",
        "reviews",
        "search",
        "files",
        "analytics",
      ];
    case "crm":
      return [
        "authentication",
        "rbac",
        "teams",
        "customers",
        "crm",
        "notifications",
        "analytics",
      ];
    case "marketplace":
      return [
        "authentication",
        "rbac",
        "products",
        "search",
        "inventory",
        "orders",
        "payments",
        "notifications",
        "files",
        "reviews",
      ];
    case "saas":
      return [
        "authentication",
        "rbac",
        "teams",
        "billing",
        "notifications",
        "analytics",
      ];
    default:
      return ["authentication", "rbac"];
  }
}
