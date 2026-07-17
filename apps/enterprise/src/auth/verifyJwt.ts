import { jwtVerify, type JWTPayload } from "jose";
import { normalizeAuthRole, type AuthRole } from "@/auth/roles";

export type VerifiedJwtUser = {
  userId: string;
  role: AuthRole;
  email?: string;
};

type SupabaseJwtPayload = JWTPayload & {
  sub?: string;
  email?: string;
  role?: string;
  app_metadata?: { role?: string };
  user_metadata?: { role?: string };
};

export async function verifySupabaseJwt(token: string): Promise<VerifiedJwtUser | null> {
  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET?.trim() || "";

  if (!supabaseJwtSecret || !token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(supabaseJwtSecret), {
      algorithms: ["HS256"],
    });

    const jwtPayload = payload as SupabaseJwtPayload;
    const userId = jwtPayload.sub?.trim() || "";
    if (!userId) {
      return null;
    }

    // Authorization comes only from server-controlled claims. `user_metadata`
    // is user-editable in Supabase and must never grant a role.
    const roleRaw = jwtPayload.app_metadata?.role || jwtPayload.role || "viewer";

    const role = normalizeAuthRole(roleRaw) || "viewer";

    return {
      userId,
      role,
      email: jwtPayload.email,
    };
  } catch {
    return null;
  }
}
