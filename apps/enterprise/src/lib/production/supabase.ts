import { createClient } from "@supabase/supabase-js";
import { getProductionEnv } from "@/lib/production/env";

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (cachedClient) return cachedClient;

  const env = getProductionEnv();
  if (!env.supabaseConfigured) {
    throw new Error(
      "Supabase production env is not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)",
    );
  }

  cachedClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
