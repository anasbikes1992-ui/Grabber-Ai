"use client";

import { useState } from "react";

type RunResponse = {
  ok: boolean;
  errors?: string[];
  dna?: { project: { name: string; architecture: { modules: string[] } } };
  classification?: { modules: string[]; features: { label: string }[] };
  handoff?: { builder_jobs: { type: string }[]; submit_to: string };
  core?: {
    ok: boolean;
    productFingerprint?: string;
    durationMs?: number;
    interventions?: number;
    error?: string;
  };
  flow?: string[];
};

export function IntelligencePanel() {
  const [text, setText] = useState(
    "Multi-tenant SaaS for agencies with login, team invites, and Stripe billing.",
  );
  const [name, setName] = useState("agency-os");
  const [submitCore, setSubmitCore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResponse | null>(null);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/intelligence/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text,
          name_hint: name,
          industry: "saas",
          submit_to_core: submitCore,
        }),
      });
      const json = (await res.json()) as RunResponse;
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
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Product name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="intel-name"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium">Client request</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            data-testid="intel-text"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={submitCore}
            onChange={(e) => setSubmitCore(e.target.checked)}
            data-testid="intel-submit-core"
          />
          Also run Grabber Core Product Factory (wall KPI path)
        </label>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          data-testid="intel-run"
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Running…" : "Run intelligence pipeline"}
        </button>
      </div>

      {result ? (
        <div
          className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          data-testid="intel-result"
        >
          <p className="font-medium">
            Status: {result.ok ? "OK" : "Failed"}
          </p>
          {result.errors?.length ? (
            <ul className="mt-2 list-disc pl-5 text-red-600">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
          {result.flow ? (
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Flow: {result.flow.join(" → ")}
            </p>
          ) : null}
          {result.dna ? (
            <div className="mt-4 space-y-1">
              <p>
                DNA: <code>{result.dna.project.name}</code>
              </p>
              <p>
                Modules:{" "}
                {result.dna.project.architecture.modules.join(", ")}
              </p>
            </div>
          ) : null}
          {result.handoff ? (
            <p className="mt-2">
              Jobs: {result.handoff.builder_jobs.length} →{" "}
              <code>{result.handoff.submit_to}</code>
            </p>
          ) : null}
          {result.core ? (
            <div className="mt-4 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-950">
              <p className="font-medium">Core factory</p>
              <p>ok: {String(result.core.ok)}</p>
              {result.core.productFingerprint ? (
                <p className="break-all">
                  fingerprint: {result.core.productFingerprint}
                </p>
              ) : null}
              {result.core.durationMs != null ? (
                <p>durationMs: {result.core.durationMs}</p>
              ) : null}
              {result.core.interventions != null ? (
                <p>interventions: {result.core.interventions}</p>
              ) : null}
              {result.core.error ? (
                <p className="text-red-600">{result.core.error}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
