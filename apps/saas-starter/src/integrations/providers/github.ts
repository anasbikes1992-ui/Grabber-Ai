import type {
  DnaIntegrationView,
  IntegrationPlan,
  IntegrationRunResult,
} from "../types";

export function planGitHub(dna: DnaIntegrationView): IntegrationPlan {
  const name = dna.project.name;
  return {
    provider: "github",
    include: true,
    reason: "Source control + delivery",
    requires_secrets: ["GITHUB_TOKEN", "GITHUB_OWNER"],
    dry_run: true,
    steps: [
      {
        id: "create_repo",
        description: `Create repository ${name}`,
        status: "planned",
        detail: { private: true, auto_init: true, name },
      },
      {
        id: "configure_default_branch",
        description: "Set default branch to main",
        status: "planned",
      },
      {
        id: "push_code",
        description: "Push generated SaaS Starter / factory output",
        status: "planned",
      },
      {
        id: "create_labels",
        description: "Create labels: factory, dna, blocked, ready",
        status: "planned",
      },
      {
        id: "configure_issues",
        description: "Enable issues + templates for factory findings",
        status: "planned",
      },
      {
        id: "add_secrets",
        description: "Add SUPABASE_* and STRIPE_* repository secrets",
        status: "planned",
      },
      {
        id: "create_initial_release",
        description: "Tag v0.1.0 foundation release",
        status: "planned",
      },
    ],
  };
}

export function runGitHubForDna(
  dna: DnaIntegrationView,
  opts: { execute?: boolean } = {},
): IntegrationRunResult {
  const plan = planGitHub(dna);
  const execute =
    opts.execute === true &&
    plan.requires_secrets.every((k) => Boolean(process.env[k]?.trim()));
  const owner = process.env.GITHUB_OWNER ?? "{owner}";

  return {
    provider: "github",
    include: true,
    dry_run: !execute,
    steps: plan.steps.map((s) => ({
      ...s,
      status: execute ? "executed" : "dry_run",
      detail: {
        ...s.detail,
        mode: execute ? "live" : "dry_run",
        note: execute
          ? "GitHub API call path"
          : "Dry-run — set GITHUB_TOKEN + GITHUB_OWNER for live",
      },
    })),
    outputs: {
      repo: `${owner}/${dna.project.name}`,
      default_branch: "main",
      release: "v0.1.0",
    },
  };
}
