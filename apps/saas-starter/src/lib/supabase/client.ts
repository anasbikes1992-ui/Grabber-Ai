import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

export function createClient() {
  const { supabaseUrl, supabaseAnonKey, demoMode } = getPublicEnv();
  if (demoMode) {
    throw new Error("Supabase is not configured — use demo auth mode");
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
