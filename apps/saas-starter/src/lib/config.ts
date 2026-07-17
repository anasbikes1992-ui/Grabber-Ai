/**
 * Product Factory configuration — env-driven, validated at load.
 */
import { FactoryError } from "./logger";

export type FactoryConfig = {
  appName: string;
  appUrl: string;
  dataDir: string;
  demoMode: boolean;
  supabaseConfigured: boolean;
  version: string;
  coreVersion: string;
};

export function loadFactoryConfig(cwd = process.cwd()): FactoryConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnon);

  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Grabber Product Factory",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    dataDir: process.env.GRABBER_DATA_DIR ?? `${cwd}/.grabber`,
    demoMode: !supabaseConfigured,
    supabaseConfigured,
    version: "2.0.0",
    coreVersion: "1.8.0",
  };
}

export function assertConfig(cfg: FactoryConfig): void {
  if (!cfg.appName) {
    throw new FactoryError("CONFIG", "appName is required", { status: 500 });
  }
  if (!cfg.dataDir) {
    throw new FactoryError("CONFIG", "dataDir is required", { status: 500 });
  }
}
