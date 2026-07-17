import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * API routes: service/JWT auth + CORS (Launch Phase 1 allows the public site).
 * Page routes: refresh the Supabase session cookie (gating lives in layouts).
 * Production CORS: set CORS_ORIGINS (comma-separated).
 */
export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return updateSession(req);
  }

  let authenticateRequest: typeof import("@/auth/getUser").authenticateRequest;
  let getRequiredAccessRole: typeof import("@/auth/permissions").getRequiredAccessRole;
  let hasRequiredAccess: typeof import("@/auth/roles").hasRequiredAccess;
  let logAuthAudit: typeof import("@/auth/audit").logAuthAudit;

  try {
    [
      { authenticateRequest },
      { getRequiredAccessRole },
      { hasRequiredAccess },
      { logAuthAudit },
    ] = await Promise.all([
      import("@/auth/getUser"),
      import("@/auth/permissions"),
      import("@/auth/roles"),
      import("@/auth/audit"),
    ]);
  } catch (error) {
    console.error(
      JSON.stringify({
        scope: "middleware",
        event: "auth_module_load_failed",
        pathname: req.nextUrl.pathname,
        method: req.method,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
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
      return allowRequest(req, requestOrigin, {
        authenticateRequest,
        getRequiredAccessRole,
        hasRequiredAccess,
        logAuthAudit,
      });
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

  return allowRequest(req, allowOrigin, {
    authenticateRequest,
    getRequiredAccessRole,
    hasRequiredAccess,
    logAuthAudit,
  });
}

async function allowRequest(
  req: NextRequest,
  allowOrigin: string,
  auth: {
    authenticateRequest: typeof import("@/auth/getUser").authenticateRequest;
    getRequiredAccessRole: typeof import("@/auth/permissions").getRequiredAccessRole;
    hasRequiredAccess: typeof import("@/auth/roles").hasRequiredAccess;
    logAuthAudit: typeof import("@/auth/audit").logAuthAudit;
  },
) {
  const authResult = await auth.authenticateRequest(req);
  if (!authResult.ok) {
    auth.logAuthAudit(req, "deny", null, auth.getRequiredAccessRole(req.nextUrl.pathname, req.method), {
      error: authResult.error,
    });
    return jsonWithCors({ ok: false, error: authResult.error }, authResult.status, allowOrigin);
  }

  const requiredRole = auth.getRequiredAccessRole(req.nextUrl.pathname, req.method);
  if (requiredRole && !auth.hasRequiredAccess(authResult.identity.accessRole, requiredRole)) {
    auth.logAuthAudit(req, "deny", authResult.identity, requiredRole, {
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

  auth.logAuthAudit(req, "allow", authResult.identity, requiredRole);

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
  // API routes (auth/CORS) + page routes (session refresh), excluding static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
