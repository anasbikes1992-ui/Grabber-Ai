"use client";

import { useMemo, useState } from "react";

type QualityBar = { label: string; percent: number; detail?: string };

type IntakeResponse = {
  ok: boolean;
  errors?: string[];
  discovery?: { summary: string; domain: string; industry: string };
  dna?: {
    project: { name: string; type: string; industry: string };
    modules: string[];
    integrations: string[];
    deployment: { provider: string };
  };
  cost?: {
    estimated_cost_usd: number;
    estimated_tokens: number;
    estimated_duration_minutes: number;
    builders: number;
    notes: string[];
  };
  review?: {
    generated_jobs: { type: string }[];
    validation_warnings: string[];
  };
  quality?: {
    confidence: number;
    completeness: number;
    ready_for_build: boolean;
    bars: QualityBar[];
    clarifications_required: string[];
    warnings: string[];
    builder_warnings: string[];
  };
  kpis?: Record<string, unknown>;
  core?: {
    ok: boolean;
    blocked?: boolean;
    reason?: string;
    productFingerprint?: string;
    durationMs?: number;
    interventions?: number;
    dna_confidence?: number;
    dna_completeness?: number;
    error?: string;
    production_url?: string;
    metrics_id?: string;
  };
  integrations?: {
    decisions: { provider: string; include: boolean; reason: string }[];
    results: {
      provider: string;
      include: boolean;
      dry_run: boolean;
      steps: { id: string; description: string; status: string }[];
    }[];
    workflow: string[];
    production_url?: string;
  } | null;
  production_url?: string | null;
  pipeline?: string[];
  assembly?: {
    ok: boolean;
    resolved: string[];
    module_reuse_rate: number;
    composition: {
      entities: string[];
      endpoints: string[];
      ui: string[];
    };
  } | null;
};

function Bar({ label, percent, detail }: QualityBar) {
  const blocks = 10;
  const filled = Math.round((percent / 100) * blocks);
  const bar = "█".repeat(filled) + "░".repeat(blocks - filled);
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-44 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      <span className="font-mono text-sm tracking-tight">
        {bar} {percent}%
      </span>
      {detail ? (
        <span className="text-xs text-zinc-500">{detail}</span>
      ) : null}
    </div>
  );
}

export function IntakeWizard() {
  const [text, setText] = useState(
    "We need a multi-tenant SaaS for agencies with email login, team invites, RBAC roles, and Stripe subscription billing. Admins configure tenants; members use the dashboard daily.",
  );
  const [name, setName] = useState("agency-os");
  const [clarifications, setClarifications] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntakeResponse | null>(null);

  const openQuestions = useMemo(
    () => result?.quality?.clarifications_required ?? [],
    [result],
  );

  async function run(opts: { approve?: boolean; submit?: boolean } = {}) {
    setLoading(true);
    try {
      const res = await fetch("/api/intake/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          name_hint: name,
          industry: "saas",
          clarifications,
          approve: opts.approve === true,
          submit_to_core: opts.submit === true,
        }),
      });
      const json = (await res.json()) as IntakeResponse;
      setResult(json);
    } catch (e) {
      setResult({
        ok: false,
        errors: [e instanceof Error ? e.message : String(e)],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="intake-wizard">
      <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Conversation
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Goal: structured Project DNA — not a form for its own sake.
        </p>
        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium">Product name</span>
          <input
            data-testid="intake-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="mt-3 block space-y-1.5">
          <span className="text-sm font-medium">Client conversation</span>
          <textarea
            data-testid="intake-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <button
          type="button"
          data-testid="intake-discover"
          disabled={loading}
          onClick={() => run()}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Running pipeline…" : "Run intake pipeline → DNA"}
        </button>
      </section>

      {openQuestions.length > 0 ? (
        <section
          className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950"
          data-testid="intake-clarifications"
        >
          <h2 className="font-semibold text-amber-950 dark:text-amber-100">
            Clarifications required
          </h2>
          <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
            Confidence is too low to submit to Grabber Core. Answer below, then
            re-run.
          </p>
          <div className="mt-4 space-y-3">
            {openQuestions.map((q) => (
              <label key={q} className="block space-y-1">
                <span className="text-sm font-medium">{q}</span>
                <input
                  value={clarifications[q] ?? ""}
                  onChange={(e) =>
                    setClarifications((c) => ({ ...c, [q]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-800 dark:bg-zinc-950"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 rounded-lg border border-amber-800 px-4 py-2 text-sm font-medium"
            onClick={() => run()}
            disabled={loading}
          >
            Re-run with answers
          </button>
        </section>
      ) : null}

      {result?.quality ? (
        <section
          className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          data-testid="intake-scores"
        >
          <h2 className="font-semibold">DNA confidence</h2>
          <div className="mt-4 space-y-2">
            {result.quality.bars.map((b) => (
              <Bar key={b.label} {...b} />
            ))}
          </div>
          <p
            className="mt-4 text-sm font-medium"
            data-testid="intake-ready"
          >
            Ready for Build:{" "}
            {result.quality.ready_for_build ? (
              <span className="text-emerald-600">YES</span>
            ) : (
              <span className="text-amber-600">NO</span>
            )}
          </p>
        </section>
      ) : null}

      {result?.dna ? (
        <section
          className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          data-testid="intake-review"
        >
          <h2 className="font-semibold">Human review</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Name / type</dt>
              <dd>
                {result.dna.project.name} · {result.dna.project.type} ·{" "}
                {result.dna.project.industry}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Domain</dt>
              <dd>{result.discovery?.domain}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">Modules</dt>
              <dd className="font-mono text-xs">
                {result.dna.modules.join(", ")}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">Integrations</dt>
              <dd className="font-mono text-xs">
                {result.dna.integrations.join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Deployment</dt>
              <dd>{result.dna.deployment.provider}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Est. cost</dt>
              <dd>
                ${result.cost?.estimated_cost_usd} ·{" "}
                {result.cost?.estimated_tokens} tokens · ~
                {result.cost?.estimated_duration_minutes} min ·{" "}
                {result.cost?.builders} builders
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">Generated jobs</dt>
              <dd className="font-mono text-xs">
                {result.review?.generated_jobs.map((j) => j.type).join(" → ")}
              </dd>
            </div>
          </dl>
          {result.review?.validation_warnings?.length ? (
            <ul className="mt-4 list-disc pl-5 text-sm text-amber-700 dark:text-amber-300">
              {result.review.validation_warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              data-testid="intake-approve"
              disabled={loading || !result.quality?.ready_for_build}
              onClick={() => run({ approve: true })}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
            >
              Approve DNA
            </button>
            <button
              type="button"
              data-testid="intake-submit-core"
              disabled={loading || !result.quality?.ready_for_build}
              onClick={() => run({ approve: true, submit: true })}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Approve & submit to Grabber Core
            </button>
          </div>
          {!result.quality?.ready_for_build ? (
            <p className="mt-3 text-xs text-zinc-500">
              Submit is blocked until Ready for Build is YES.
            </p>
          ) : null}
        </section>
      ) : null}

      {result?.core ? (
        <section
          className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          data-testid="intake-core"
        >
          <h2 className="font-semibold">Core + Integration Layer</h2>
          <p>ok: {String(result.core.ok)}</p>
          {result.pipeline ? (
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              {result.pipeline.join(" → ")}
            </p>
          ) : null}
          {result.core.blocked ? (
            <p className="text-amber-700">{result.core.reason}</p>
          ) : null}
          {result.core.productFingerprint ? (
            <p className="break-all">
              fingerprint: {result.core.productFingerprint}
            </p>
          ) : null}
          {result.core.durationMs != null ? (
            <p>durationMs: {result.core.durationMs}</p>
          ) : null}
          {result.core.dna_confidence != null ? (
            <p>
              DNA confidence / completeness: {result.core.dna_confidence}% /{" "}
              {result.core.dna_completeness}%
            </p>
          ) : null}
          {result.core.metrics_id ? (
            <p>metrics_id: {result.core.metrics_id}</p>
          ) : null}
          {(result.production_url || result.core.production_url) ? (
            <p data-testid="production-url" className="mt-2 font-medium text-emerald-700">
              Production URL:{" "}
              {result.production_url ?? result.core.production_url}
            </p>
          ) : null}
          {result.assembly ? (
            <div className="mt-3" data-testid="module-assembly">
              <p className="font-medium">
                Module reuse:{" "}
                {(result.assembly.module_reuse_rate * 100).toFixed(0)}%
              </p>
              <p className="font-mono text-xs">
                {result.assembly.resolved.join(" → ")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {result.assembly.composition.entities.length} entities ·{" "}
                {result.assembly.composition.endpoints.length} endpoints ·{" "}
                {result.assembly.composition.ui.length} UI components
              </p>
            </div>
          ) : null}
          {result.integrations?.decisions ? (
            <ul className="mt-3 list-disc pl-5" data-testid="integration-decisions">
              {result.integrations.decisions.map((d) => (
                <li key={d.provider}>
                  <strong>{d.provider}</strong>:{" "}
                  {d.include ? "include" : "skip"} — {d.reason}
                </li>
              ))}
            </ul>
          ) : null}
          {result.core.error ? (
            <p className="text-red-600">{result.core.error}</p>
          ) : null}
        </section>
      ) : null}

      {result?.errors?.length ? (
        <p className="text-sm text-red-600" role="alert">
          {result.errors.join("; ")}
        </p>
      ) : null}
    </div>
  );
}
