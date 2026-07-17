import type { AccessRole } from "@/auth/roles";

const ADMIN_ONLY_PREFIXES = ["/api/demo/seed", "/api/playbooks", "/api/ops"];
const ADMIN_ONLY_SEGMENTS = ["govern", "commercial", "design", "analyze", "handoff"];

const PUBLIC_ROUTE_RULES: Array<{ path: string; methods: string[] }> = [
  { path: "/api/leads", methods: ["POST"] },
  { path: "/api/consulting", methods: ["POST"] },
];

export function isPublicRoute(pathname: string, method: string) {
  return PUBLIC_ROUTE_RULES.some(
    (rule) => pathname === rule.path && rule.methods.includes(method.toUpperCase()),
  );
}

export function getRequiredAccessRole(pathname: string, method: string): AccessRole | null {
  const upperMethod = method.toUpperCase();
  if (upperMethod === "OPTIONS") {
    return null;
  }

  if (ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "admin";
  }

  const segments = pathname.split("/").filter(Boolean);
  if (ADMIN_ONLY_SEGMENTS.some((segment) => segments.includes(segment))) {
    return "admin";
  }

  if (upperMethod === "GET" || upperMethod === "HEAD") {
    return "viewer";
  }

  return "operator";
}
