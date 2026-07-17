"use client";

import { useState } from "react";
import { PageHeader, Section, StatusPill } from "@/components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const DEFAULT_STORY = `I own a textile raw material wholesale business in Sri Lanka. I want to modernize my operations. Help me design the best system for my business — act as senior consultant, industry specialist, architect, UX designer, CTO, security expert, and operations manager. Interview me thoroughly. Challenge assumptions. Recommend best practices. Separate essential from optional. Produce a complete business blueprint before any software is designed.`;

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = (await response.text()).trim();
  return {
    ok: response.ok,
    error: text || `Request failed with status ${response.status}`,
  };
}

export default function ConsultPage() {
  const [story, setStory] = useState(DEFAULT_STORY);
  const [name, setName] = useState("Lanka Textiles");
  const [engagement, setEngagement] = useState<Any>(null);
  const [status, setStatus] = useState<Any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pkg, setPkg] = useState<Any>(null);
  const [proposalSteps, setProposalSteps] = useState<string[]>([]);

  async function post(body: object) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/consulting", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const res = await readApiResponse(response);
      if (!res.ok) throw new Error(res.error || "failed");
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    const res = await post({ action: "start", story, name });
    if (!res) return;
    setEngagement(res.engagement);
    setStatus(res.status);
    setPkg(null);
    setProposalSteps([]);
  }

  async function submitAnswers() {
    if (!engagement) return;
    const res = await post({
      action: "answer",
      id: engagement.id,
      answers,
    });
    if (!res) return;
    setEngagement(res.engagement);
    setStatus({
      confidence: res.confidence,
      ready: res.ready,
      next_questions: res.next_questions,
      remaining: res.remaining,
    });
  }

  async function runRest() {
    if (!engagement) return;
    for (const action of ["intelligence", "gaps", "review", "package"] as const) {
      const res = await post({ action, id: engagement.id });
      if (!res) return;
      setEngagement(res.engagement);
      if (res.package) setPkg(res.package);
      if (res.engagement?.consulting?.solution_package) {
        setPkg(res.engagement.consulting.solution_package);
      }
      if (action === "package") {
        const steps =
          res.package?.executive_presentation?.sections?.next_steps ||
          res.engagement?.consulting?.executive_presentation?.sections?.next_steps ||
          res.package?.next_steps ||
          [];
        setProposalSteps(Array.isArray(steps) ? steps : []);
      }
    }
  }

  const nextQs =
    status?.next_questions ||
    engagement?.consulting?.interview?.pending?.filter(
      (q: Any) => !engagement?.consulting?.interview?.answers?.[q.id],
    )?.slice(0, 5) ||
    [];

  return (
    <div>
      <PageHeader
        title="Jarvis Consulting"
        description="Describe your business — not software. Jarvis interviews, benchmarks patterns (never copies), gaps, multi-agent review, then a full blueprint. Factory only after governance."
      />

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <Section title="Business story">
        <input
          className="input mb-2 max-w-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Business name"
        />
        <textarea
          className="textarea font-mono text-xs"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          rows={8}
        />
        <button className="btn btn-primary mt-3" disabled={busy} onClick={start}>
          {busy ? "…" : "Start discovery interview"}
        </button>
      </Section>

      {engagement ? (
        <div className="mt-4 space-y-4">
          <Section title="Session">
            <div className="flex flex-wrap gap-2 text-sm">
              <StatusPill status={engagement.consulting?.stage || "discovery"} />
              <span className="muted">
                Confidence:{" "}
                {Math.round((engagement.consulting?.confidence || 0) * 100)}% /
                {Math.round(
                  (engagement.consulting?.confidence_threshold || 0.8) * 100,
                )}
                %
              </span>
              <span className="muted text-xs">{engagement.id}</span>
            </div>
            <p className="mt-2 text-xs text-(--muted)">
              {engagement.consulting?.legal_boundary}
            </p>
          </Section>

          <Section title="Interview (Jarvis asks — you answer)">
            {nextQs.length === 0 ? (
              <p className="text-sm text-emerald-300">
                Discovery threshold met (or no pending). Run intelligence → package.
              </p>
            ) : (
              <div className="space-y-3">
                {nextQs.map((q: Any) => (
                  <div key={q.id}>
                    <label className="label">{q.prompt}</label>
                    <textarea
                      className="textarea text-sm"
                      value={answers[q.id] || ""}
                      onChange={(e) =>
                        setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                      }
                    />
                  </div>
                ))}
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={submitAnswers}
                >
                  Submit answers
                </button>
              </div>
            )}
          </Section>

          <Section title="Consulting pipeline">
            <button className="btn btn-primary" disabled={busy} onClick={runRest}>
              Run intelligence → gaps → review → package
            </button>
            <p className="mt-2 text-xs muted">
              Blocked until discovery confidence ≥ threshold. Never starts factory.
            </p>
          </Section>

          {pkg ? (
            <Section title="Solution package (pre-factory)">
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-(--muted)">Business</p>
                  <p>{pkg.business?.executive_summary || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-(--muted)">Essential</p>
                  <p>
                    {pkg.functional?.requirements
                      ?.filter((r: Any) => r.class === "essential")
                      .map((r: Any) => r.capability)
                      .join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-(--muted)">Recommended</p>
                  <p>
                    {pkg.functional?.requirements
                      ?.filter((r: Any) => r.class === "recommended")
                      .map((r: Any) => r.capability)
                      .slice(0, 6)
                      .join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-(--muted)">Proposal steps</p>
                  {proposalSteps.length ? (
                    <ol className="mt-2 space-y-2">
                      {proposalSteps.slice(0, 6).map((step, index) => (
                        <li
                          key={`${index}-${step}`}
                          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                        >
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>—</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase text-(--muted)">Commercial total</p>
                  <p>
                    {pkg.commercial?.pricing?.total != null
                      ? `$${pkg.commercial.pricing.total.toLocaleString()}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-(--muted)">Factory</p>
                  <p>{pkg.factory ? JSON.stringify(pkg.factory, null, 2) : "—"}</p>
                </div>
              </div>
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
