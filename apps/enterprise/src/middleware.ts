import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/auth/getUser";
import { getRequiredAccessRole } from "@/auth/permissions";
import { hasRequiredAccess } from "@/auth/roles";
import { logAuthAudit } from "@/auth/audit";

/**
 * Allow public website (:3003) to call consulting APIs during Launch Phase 1 local dev.
 * Production: set CORS_ORIGINS env (comma-separated).
 */
export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin") || "";
  const requestOrigin = req.nextUrl.origin;
  const configuredOrigins =
    process.env.CORS_ORIGINS?.trim() || process.env.ALLOWED_ORIGINS?.trim() || "";
  const fallbackDevOrigins =
    process.env.NODE_ENV === "production"
      ? ""
      : "http://127.0.0.1:3003,http://localhost:3003,http://127.0.0.1:3001,http://localhost:3001";

  const allowed = (configuredOrigins || fallbackDevOrigins)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowed.length === 0) {
    if (!origin || origin === requestOrigin) {
      return allowRequest(req, requestOrigin);
    }
    return new NextResponse("CORS not configured", { status: 500 });
  }

  if (origin && origin !== requestOrigin && !allowed.includes(origin)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const allowOrigin = origin || requestOrigin || allowed[0];

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(allowOrigin),
    });
  }

  return allowRequest(req, allowOrigin);
}

async function allowRequest(req: NextRequest, allowOrigin: string) {
  const authResult = await authenticateRequest(req);
  if (!authResult.ok) {
    logAuthAudit(req, "deny", null, getRequiredAccessRole(req.nextUrl.pathname, req.method), {
      error: authResult.error,
    });
    return jsonWithCors({ ok: false, error: authResult.error }, authResult.status, allowOrigin);
  }

  const requiredRole = getRequiredAccessRole(req.nextUrl.pathname, req.method);
  if (requiredRole && !hasRequiredAccess(authResult.identity.accessRole, requiredRole)) {
    logAuthAudit(req, "deny", authResult.identity, requiredRole, {
      error: `insufficient role: requires ${requiredRole}`,
    });
    return jsonWithCors(
      {
        ok: false,
        error: `insufficient role: requires ${requiredRole}`,
      },
      403,
      allowOrigin,
    );
  }

  const forwardedHeaders = new Headers(req.headers);
  forwardedHeaders.delete("x-jarvis-user-id");
  forwardedHeaders.delete("x-jarvis-role");
  forwardedHeaders.delete("x-auth-user-id");
  forwardedHeaders.delete("x-auth-role");
  forwardedHeaders.set("x-jarvis-user-id", authResult.identity.userId);
  forwardedHeaders.set("x-jarvis-role", authResult.identity.authRole);

  const res = NextResponse.next({
    request: {
      headers: forwardedHeaders,
    },
  });
  for (const [k, v] of Object.entries(corsHeaders(allowOrigin))) {
    res.headers.set(k, v);
  }
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("x-auth-user-id", authResult.identity.userId);
  res.headers.set("x-auth-role", authResult.identity.authRole);

  logAuthAudit(req, "allow", authResult.identity, requiredRole);

  return res;
}

function jsonWithCors(body: Record<string, unknown>, status: number, origin: string) {
  const response = NextResponse.json(body, { status });
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    response.headers.set(k, v);
  }
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Enterprise-Api-Key, X-Jarvis-User-Id, X-Jarvis-Role",
    "Access-Control-Max-Age": "86400",
  };
}

export const config = {
  matcher: "/api/:path*",
};
