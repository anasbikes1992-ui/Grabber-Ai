import type { NextRequest } from "next/server";
import type { RequestIdentity } from "@/auth/getUser";
import type { AccessRole } from "@/auth/roles";

type AuditOutcome = "allow" | "deny";

export function logAuthAudit(
  req: NextRequest,
  outcome: AuditOutcome,
  identity: RequestIdentity | null,
  requiredRole: AccessRole | null,
  details?: { error?: string },
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = req.headers.get("user-agent") || "unknown";

  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      user_id: identity?.userId || "anonymous",
      role: identity?.authRole || "none",
      action: `${req.method.toUpperCase()} ${req.nextUrl.pathname}`,
      resource: req.nextUrl.pathname,
      result: outcome,
      required_role: requiredRole || "none",
      ip,
      user_agent: userAgent,
      auth_source: identity?.source || "none",
      error: details?.error || null,
    }),
  );
}
