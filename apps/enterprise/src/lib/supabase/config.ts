/**
 * Single source of truth for public Supabase connection config.
 *
 * Resilient to env naming across setups:
 *  - URL: NEXT_PUBLIC_SUPABASE_URL, else the integration's SUPABASE_URL —
 *    and only a value that is actually an http(s) URL is accepted, so a
 *    broken manual var can't crash auth.
 *  - anon key: any of the public anon/publishable names. Never the
 *    service-role / secret key (those bypass RLS and must stay server-only).
 */
function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const v of values) {
    const t = (v ?? "").trim();
    if (t) return t;
  }
  return "";
}

function firstValidUrl(...values: (string | undefined)[]): string {
  for (const v of values) {
    const t = (v ?? "").trim();
    if (/^https?:\/\//i.test(t)) return t;
  }
  return "";
}

export function getSupabaseUrl(): string {
  return firstValidUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
  );
}

export function getSupabaseAnonKey(): string {
  return firstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
