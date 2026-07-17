import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * App session identity for page-level gating (owner console vs client portal).
 *
 * Authorization is derived ONLY from server-controlled sources:
 *  - the OWNER_EMAIL allowlist, and
 *  - Supabase `app_metadata` (set with the service-role key).
 * `user_metadata` is user-editable and is never trusted for authorization.
 */
export type AppRole = "admin" | "client";

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
  /** For clients: the single engagement they may view. */
  engagementId: string | null;
};

function ownerEmails(): string[] {
  return (process.env.OWNER_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    // getUser() authenticates the token with the Supabase Auth server —
    // do not trust getSession() alone for authorization.
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (error || !user?.email) return null;

    const email = user.email.toLowerCase();
    const appMeta = (user.app_metadata ?? {}) as {
      role?: string;
      engagement_id?: string;
    };

    const isOwner =
      ownerEmails().includes(email) ||
      appMeta.role === "admin" ||
      appMeta.role === "owner";

    return {
      id: user.id,
      email,
      role: isOwner ? "admin" : "client",
      engagementId: isOwner ? null : appMeta.engagement_id ?? null,
    };
  } catch {
    return null;
  }
}
