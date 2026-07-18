import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/config";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export { isSupabaseConfigured };

/**
 * Server Supabase client bound to the request cookie jar.
 * Reads sessions in server components and writes refreshed cookies from
 * server actions / route handlers. Uses the anon/publishable key — RLS enforces access.
 */
export async function createSupabaseServerClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Invoked from a Server Component render — cookie writes are a no-op
          // here; the middleware session refresh handles token rotation.
        }
      },
    },
  });
}
