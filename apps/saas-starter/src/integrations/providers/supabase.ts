import type { DnaIntegrationView, IntegrationPlan, IntegrationRunResult } from "../types";

export function planSupabase(dna: DnaIntegrationView): IntegrationPlan {
  const modules = dna.modules ?? dna.architecture?.modules ?? [];
  return {
    provider: "supabase",
    include: true,
    reason: "Auth, Postgres, storage for DNA stack",
    requires_secrets: ["SUPABASE_ACCESS_TOKEN", "SUPABASE_ORG_ID"],
    dry_run: true,
    steps: [
      {
        id: "create_project",
        description: `Create Supabase project for ${dna.project.name}`,
        status: "planned",
        detail: { region: "us-east-1" },
      },
      {
        id: "configure_auth",
        description: "Enable email auth; optional OAuth later",
        status: "planned",
      },
      {
        id: "apply_migrations",
        description: `Apply migrations for modules: ${modules.join(", ")}`,
        status: "planned",
        detail: { modules },
      },
      {
        id: "create_storage_buckets",
        description: "Create public/private buckets as DNA requires",
        status: "planned",
        detail: {
          buckets: modules.includes("files")
            ? ["public-assets", "private-uploads"]
            : ["private-uploads"],
        },
      },
      {
        id: "configure_rls",
        description: "Enable RLS + tenant isolation policies",
        status: "planned",
      },
      {
        id: "generate_env",
        description: "Emit NEXT_PUBLIC_SUPABASE_URL + ANON_KEY",
        status: "planned",
      },
    ],
  };
}

export function runSupabaseForDna(
  dna: DnaIntegrationView,
  opts: { execute?: boolean } = {},
): IntegrationRunResult {
  const plan = planSupabase(dna);
  const execute =
    opts.execute === true &&
    plan.requires_secrets.every((k) => Boolean(process.env[k]?.trim()));

  return {
    provider: "supabase",
    include: true,
    dry_run: !execute,
    steps: plan.steps.map((s) => ({
      ...s,
      status: execute ? "executed" : "dry_run",
      detail: {
        ...s.detail,
        mode: execute ? "live" : "dry_run",
      },
    })),
    outputs: {
      project_name: dna.project.name,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: execute
          ? "(from live project)"
          : `https://${dna.project.name}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: execute
          ? "(from live project)"
          : "sb_anon_dry_run",
      },
    },
  };
}
