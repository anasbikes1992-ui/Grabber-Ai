"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Section, StatusPill } from "@/components/ui";
import { PipelineStepper, money, stageOf } from "@/components/pipeline";

const GOV_STEPS = [
  { stage: "risk_review", label: "Risk" },
  { stage: "legal_review", label: "Legal" },
  { stage: "internal_approval", label: "Internal" },
  { stage: "client_approval", label: "Client" },
  { stage: "deposit_received", label: "Deposit" },
  { stage: "factory_ready", label: "Factory ready" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Eng = any;

export default function EngagementDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [e, setE] = useState<Eng | null>(null);
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [nextQs, setNextQs] = useState<
    { id: string; prompt: string; section?: string }[]
  >([]);
  const [handoff, setHandoff] = useState<Eng | null>(null);
  const [tab, setTab] = useState<
    "discovery" | "analysis" | "proposal" | "governance"
  >("discovery");

  const load = useCallback(async () => {
    const res = await fetch(`/api/engagements/${id}`).then((r) => r.json());
    if (res.ok) {
      setE(res.engagement);
      const answers = res.engagement.consulting?.interview?.answers || {};
      setAnswerMap((prev) => ({ ...answers, ...prev }));
      // seed next questions from pending
      const pending = (res.engagement.consulting?.interview?.pending || [])
        .filter(
          (q: { id: string }) =>
            !res.engagement.consulting?.interview?.answers?.[q.id],
        )
        .slice(0, 4);
      if (pending.length) setNextQs(pending);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!e) return;
    const st = stageOf(e);
    if (st === "proposal" || st === "approval" || st === "ready") {
      setTab("proposal");
    } else if (st === "analysis") setTab("analysis");
    else setTab("discovery");
  }, [e?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const confPct = useMemo(
    () => Math.round((e?.consulting?.confidence || 0) * 100),
    [e?.consulting?.confidence],
  );

  async function consultAnswer() {
    setBusy("answer");
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/consulting", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          id,
          answers: answerMap,
        }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setE(res.engagement);
      setNextQs(res.next_questions || []);
      setMsg(res.message || "Saved");
      if (res.ready) setTab("analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function runConsultingStep(
    action: "intelligence" | "gaps" | "review" | "package",
  ) {
    setBusy(action);
    setError("");
    try {
      const res = await fetch("/api/consulting", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, id }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setE(res.engagement);
      setMsg(
        action === "package"
          ? "Proposal package generated"
          : `Completed: ${action}`,
      );
      if (action === "package") setTab("proposal");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function runFullAnalysis() {
    setBusy("full");
    setError("");
    try {
      for (const action of ["intelligence", "gaps", "review", "package"] as const) {
        const res = await fetch("/api/consulting", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, id }),
        }).then((r) => r.json());
        if (!res.ok) throw new Error(res.error || action);
        setE(res.engagement);
      }
      setMsg("Analysis → proposal complete");
      setTab("proposal");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function govern(stage: string) {
    setBusy(stage);
    setError("");
    try {
      const res = await fetch(`/api/engagements/${id}/govern`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          stage,
          actor: stage.includes("client") ? "client" : "ops",
          notes: "approved via Business OS",
        }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setE(res.engagement);
      setMsg(`Governance: ${stage.replaceAll("_", " ")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  async function fetchHandoff() {
    setBusy("handoff");
    setError("");
    try {
      const res = await fetch(`/api/engagements/${id}/handoff`).then((r) =>
        r.json(),
      );
      if (!res.ok) throw new Error(res.error);
      setHandoff(res.handoff);
      setMsg("Factory handoff ready (internal)");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy("");
    }
  }

  if (!e) {
    return <p className="muted">Loading engagement…</p>;
  }

  const st = stageOf(e);
  const dims = e.consulting?.confidence_dimensions || {};
  const proposal = e.commercial?.deliverables?.proposal || e.commercial?.summary;
  const briefs = e.consulting?.gap_analysis?.decision_briefs || [];

  return (
    <div>
      <PageHeader
        title={e.client_name}
        description={`${e.industry} · ${e.id.slice(0, 8)}…`}
        actions={
          <Link href="/business" className="btn btn-ghost">
            ← Pipeline
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusPill status={st} />
        <StatusPill status={e.governance_stage} />
        {e.factory_eligible ? <StatusPill status="factory_eligible" /> : null}
        {e.consulting?.llm?.path ? (
          <span className="badge">consult: {e.consulting.llm.path}</span>
        ) : null}
      </div>

      <PipelineStepper current={st} className="mb-6" />

      {msg ? (
        <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm">
          {msg}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {(
          [
            ["discovery", "1 · Discovery"],
            ["analysis", "2 · Analysis"],
            ["proposal", "3 · Proposal"],
            ["governance", "4 · Approval"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={`btn text-xs ${tab === k ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "discovery" ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <Section title="Business context" className="lg:col-span-2">
            <p className="text-sm text-[var(--muted)]">
              {e.consulting?.business_story || e.notes || "No story recorded."}
            </p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
                <span>Discovery confidence</span>
                <span>{confPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all"
                  style={{ width: `${Math.min(100, confPct)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Threshold {Math.round((e.consulting?.confidence_threshold || 0.9) * 100)}%
                before analysis package.
              </p>
            </div>
            {Object.keys(dims).length > 0 ? (
              <ul className="mt-4 space-y-1 text-xs">
                {Object.entries(dims).map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-2">
                    <span className="muted">{k.replaceAll("_", " ")}</span>
                    <span>{Math.round(Number(v) * 100)}%</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Section>

          <Section title="Interview" className="lg:col-span-3">
            {(nextQs.length ? nextQs : [
              { id: "products", prompt: "What products or services do you sell?" },
              { id: "pain", prompt: "What are the top operational pains?" },
              { id: "success", prompt: "What does success look like in 90 days?" },
            ]).map((q) => (
              <div key={q.id} className="mb-3">
                <label className="label">{q.prompt}</label>
                <textarea
                  className="textarea text-sm"
                  rows={2}
                  value={answerMap[q.id] || ""}
                  onChange={(ev) =>
                    setAnswerMap((a) => ({ ...a, [q.id]: ev.target.value }))
                  }
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!!busy}
                onClick={consultAnswer}
              >
                {busy === "answer" ? "Saving…" : "Submit answers / get follow-ups"}
              </button>
              {e.consulting?.ready_for_intelligence || confPct >= 90 ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={!!busy}
                  onClick={() => setTab("analysis")}
                >
                  Continue to analysis →
                </button>
              ) : null}
            </div>
          </Section>
        </div>
      ) : null}

      {tab === "analysis" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Run consulting analysis">
            <p className="mb-3 text-sm text-[var(--muted)]">
              Industry intelligence → gap analysis → multi-department review →
              commercial package. Uses LLM when configured; otherwise deterministic.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!!busy}
                onClick={runFullAnalysis}
              >
                {busy === "full" ? "Running…" : "Run full analysis → proposal"}
              </button>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                disabled={!!busy}
                onClick={() => runConsultingStep("intelligence")}
              >
                Intel only
              </button>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                disabled={!!busy}
                onClick={() => runConsultingStep("gaps")}
              >
                Gaps only
              </button>
            </div>
            {e.consulting?.gap_analysis ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium">Future state</p>
                <p className="muted">
                  {e.consulting.gap_analysis.future_state_summary}
                </p>
              </div>
            ) : null}
          </Section>

          <Section title="Decision briefs">
            {briefs.length === 0 ? (
              <p className="text-sm muted">Run gap analysis to populate recommendations.</p>
            ) : (
              <ul className="max-h-96 space-y-3 overflow-auto">
                {briefs.slice(0, 8).map(
                  (b: {
                    recommendation: string;
                    reason: string;
                    confidence_pct?: number;
                    classification?: string;
                  }) => (
                    <li
                      key={b.recommendation}
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong>{b.recommendation}</strong>
                        <StatusPill
                          status={b.classification || "recommended"}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">{b.reason}</p>
                      {b.confidence_pct != null ? (
                        <p className="mt-1 text-xs text-sky-300/80">
                          Confidence {b.confidence_pct}%
                        </p>
                      ) : null}
                    </li>
                  ),
                )}
              </ul>
            )}
          </Section>
        </div>
      ) : null}

      {tab === "proposal" ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <Section title="Proposal" className="lg:col-span-3">
            {!e.commercial ? (
              <div>
                <p className="mb-3 text-sm muted">
                  No commercial package yet. Run analysis first.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!!busy}
                  onClick={runFullAnalysis}
                >
                  Generate proposal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-violet-500/10 p-5">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    Investment
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {money(e.commercial.pricing?.total)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Deposit {money(e.commercial.pricing?.deposit)} ·{" "}
                    {e.commercial.pricing?.payment_terms}
                  </p>
                  <p className="mt-3 text-sm">
                    Timeline:{" "}
                    <strong>{e.commercial.timeline?.weeks || e.solution?.timeline_weeks}</strong>{" "}
                    weeks · Blueprint{" "}
                    <strong>{e.solution?.blueprint || "—"}</strong>
                  </p>
                </div>

                {proposal ? (
                  <div className="text-sm">
                    <p className="font-medium">
                      {proposal.headline || `Proposal for ${e.client_name}`}
                    </p>
                    <p className="mt-2 muted">
                      Validity {proposal.validity_days || 30} days · Modules:{" "}
                      {(e.solution?.modules || []).slice(0, 8).join(", ")}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <a
                    className="btn btn-primary"
                    href={`/api/consulting?id=${id}&format=html`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open executive briefing
                  </a>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setTab("governance")}
                  >
                    Move to approval →
                  </button>
                </div>
              </div>
            )}
          </Section>

          <Section title="Package contents" className="lg:col-span-2">
            <ul className="space-y-1 text-sm">
              {Object.keys(e.commercial?.deliverables || e.deliverables || {})
                .slice(0, 14)
                .map((k) => (
                  <li
                    key={k}
                    className="flex justify-between border-b border-[var(--border)] py-1.5"
                  >
                    <span className="muted">{k.replaceAll("_", " ")}</span>
                    <span className="text-xs text-emerald-300/80">ready</span>
                  </li>
                ))}
            </ul>
            {e.consulting?.roi?.narrative ? (
              <p className="mt-4 text-xs text-[var(--muted)]">
                {e.consulting.roi.narrative}
              </p>
            ) : null}
          </Section>
        </div>
      ) : null}

      {tab === "governance" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Approvals">
            <p className="mb-4 text-sm text-[var(--muted)]">
              Dual approval + deposit required before factory handoff. Client
              narrative: consulting team — factory stays internal.
            </p>
            <div className="flex flex-wrap gap-2">
              {GOV_STEPS.map((g) => {
                const done =
                  e.governance_history?.some(
                    (h: { stage: string }) => h.stage === g.stage,
                  ) || e.governance_stage === g.stage;
                return (
                  <button
                    key={g.stage}
                    type="button"
                    className={`btn text-xs ${done ? "btn-primary" : "btn-ghost"}`}
                    disabled={!!busy}
                    onClick={() => govern(g.stage)}
                  >
                    {busy === g.stage ? "…" : g.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-1 text-xs muted">
              <p>Internal: {e.approvals?.internal ? "✓" : "—"}</p>
              <p>Client: {e.approvals?.client ? "✓" : "—"}</p>
              <p>Deposit: {e.approvals?.deposit ? "✓" : "—"}</p>
            </div>
          </Section>

          <Section title="Factory handoff (internal)">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!!busy}
              onClick={fetchHandoff}
            >
              {busy === "handoff" ? "Checking…" : "Request DNA handoff"}
            </button>
            {handoff ? (
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  Fingerprint{" "}
                  <code className="text-sky-300">{handoff.fingerprint}</code>
                </p>
                <p className="muted">
                  Eligible: {String(handoff.factory_eligible)} · Blueprint{" "}
                  {handoff.project_dna?.product?.blueprint}
                </p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-xs">
                  {JSON.stringify(
                    {
                      engagement_id: handoff.engagement_id,
                      modules: handoff.project_dna?.modules,
                      commercial_refs: handoff.commercial_refs,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            ) : (
              <p className="mt-3 text-sm muted">
                Blocked until internal + client approval + deposit.
              </p>
            )}
          </Section>
        </div>
      ) : null}
    </div>
  );
}
