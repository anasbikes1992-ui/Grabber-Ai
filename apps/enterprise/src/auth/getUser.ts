import type { NextRequest } from "next/server";
import { isPublicRoute } from "@/auth/permissions";
import { isValidServiceApiKey, extractBearerToken } from "@/auth/serviceAuth";
import { toAccessRole, type AccessRole, type AuthRole } from "@/auth/roles";
import { verifySupabaseJwt } from "@/auth/verifyJwt";

export type RequestIdentity = {
  userId: string;
  authRole: AuthRole;
  accessRole: AccessRole;
  source: "public" | "service" | "jwt";
};

export type RequestAuthResult =
  | { ok: true; identity: RequestIdentity }
  | { ok: false; status: number; error: string };

export async function authenticateRequest(req: NextRequest): Promise<RequestAuthResult> {
  const pathname = req.nextUrl.pathname;
  const method = req.method;

  if (isPublicRoute(pathname, method)) {
    return {
      ok: true,
      identity: {
        userId: "public",
        authRole: "viewer",
        accessRole: "viewer",
        source: "public",
      },
    };
  }

  if (isValidServiceApiKey(req.headers)) {
    const serviceName = req.headers.get("x-service-name")?.trim() || "system";
    return {
      ok: true,
      identity: {
        userId: `service:${serviceName}`,
        authRole: "admin",
        accessRole: "admin",
        source: "service",
      },
    };
  }

  const jwt = extractBearerToken(req.headers.get("authorization"));
  const verifiedUser = await verifySupabaseJwt(jwt);

  if (!verifiedUser) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
    };
  }

  return {
    ok: true,
    identity: {
      userId: verifiedUser.userId,
      authRole: verifiedUser.role,
      accessRole: toAccessRole(verifiedUser.role),
      source: "jwt",
    },
  };
}
