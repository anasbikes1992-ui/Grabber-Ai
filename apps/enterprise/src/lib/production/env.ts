export type ProductionEnv = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseConfigured: boolean;
  storageBucket: string;
  appEnv: string;
};

export function getProductionEnv(): ProductionEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseConfigured: Boolean(supabaseUrl && supabaseServiceRoleKey),
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || "documents",
    appEnv: process.env.NODE_ENV || "development",
  };
}
