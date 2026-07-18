import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

export type CookieIdentity = { userId: string; email: string; role: string };

function ownerEmails(): string[] {
  return (process.env.OWNER_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Reads the Supabase session from the request cookies (for console page →
 * API calls that authenticate by cookie rather than a Bearer token).
 * Role is derived only from server-controlled sources (OWNER_EMAIL allowlist
 * + app_metadata), never user_metadata.
 */
export async function getCookieIdentity(req: NextRequest): Promise<CookieIdentity | null> {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    });
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user?.email) return null;

    const email = user.email.toLowerCase();
    const appRole = (user.app_metadata as { role?: string } | undefined)?.role;
    const isOwner =
      ownerEmails().includes(email) || appRole === "admin" || appRole === "owner";

    return { userId: user.id, email, role: isOwner ? "admin" : appRole || "client" };
  } catch {
    return null;
  }
}
