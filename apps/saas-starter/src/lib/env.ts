/**
 * Public env access. Missing Supabase vars enable "demo mode" so local
 * login works without a live project (Sprint 1 DoD).
 */
export function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const configured = Boolean(supabaseUrl && supabaseAnonKey);

  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Grabber SaaS Starter",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    supabaseUrl,
    supabaseAnonKey,
    supabaseConfigured: configured,
    demoMode: !configured,
  };
}
