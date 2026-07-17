"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import { ENTERPRISE_URL } from "@/lib/config";

const EXAMPLE = `I own a textile raw material wholesale business in Sri Lanka. I want to modernize my operations. Help me design the best system for my business. Interview me thoroughly until you understand. Challenge my assumptions. Recommend industry best practices. Separate essential features from optional enhancements. Produce a complete business blueprint before any software is designed.`;

/**
 * Public customer journey entry.
 * Customers never see prompts — only a business story field.
 * Hands off to enterprise consulting API / workspace.
 */
export default function ConsultPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [story, setStory] = useState(EXAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState<{
    id: string;
    industry?: string;
    confidence?: number;
    next?: { id: string; prompt: string }[];
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{
    essential?: string[];
    recommended?: string[];
    total?: number;
    stage?: string;
    engagementId?: string;
    llmPath?: string;
  } | null>(null);
  const [llmMode, setLlmMode] = useState<string>("…");

  async function refreshLlmStatus() {
    try {
      const res = await fetch(`${ENTERPRISE_URL}/api/consulting`).then((r) =>
        r.json(),
      );
      if (res.ok && res.llm) {
        setLlmMode(
          res.llm.available
            ? `LLM on (${res.llm.model})`
            : "Deterministic fallback (set ANTHROPIC_API_KEY for LLM)",
        );
      }
    } catch {
      setLlmMode("Enterprise offline");
    }
  }

  useEffect(() => {
    void refreshLlmStatus();
  }, []);

  async function start() {
    setBusy(true);
    setError("");
    setDone(null);
    void refreshLlmStatus();
    try {
      const res = await fetch(`${ENTERPRISE_URL}/api/consulting`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "start",
          name: name || "Prospective client",
          email,
          story,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not start consultation");
      setSession({
        id: data.engagement.id,
        industry: data.engagement.industry,
        confidence: data.engagement.consulting?.confidence,
        next: data.status?.next_questions || [],
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message}. Is enterprise running on ${ENTERPRISE_URL}? (npm run enterprise:dev)`
          : String(e),
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswers() {
    if (!session) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${ENTERPRISE_URL}/api/consulting`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          id: session.id,
          answers,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Answer failed");
      setSession({
        id: session.id,
        industry: data.engagement?.industry,
        confidence: data.confidence,
        next: data.next_questions || [],
      });
      if (data.ready) {
        await finishPackage(session.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function finishPackage(id: string) {
    setBusy(true);
    try {
      for (const action of ["intelligence", "gaps", "review", "package"]) {
        const res = await fetch(`${ENTERPRISE_URL}/api/consulting`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, id }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || `${action} failed`);
        if (action === "package") {
          const pkg =
            data.package || data.engagement?.consulting?.solution_package;
          setDone({
            stage: data.engagement?.consulting?.stage,
            engagementId: id,
            llmPath: pkg?.llm?.path || data.engagement?.consulting?.llm?.path,
            essential: pkg?.functional?.requirements
              ?.filter((r: { class: string }) => r.class === "essential")
              .map((r: { capability: string }) => r.capability),
            recommended: pkg?.functional?.requirements
              ?.filter((r: { class: string }) => r.class === "recommended")
              .map((r: { capability: string }) => r.capability)
              .slice(0, 6),
            total: pkg?.commercial?.pricing?.total,
          });
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="section pt-12 pb-24">
      <div className="container-x max-w-3xl">
        <p className="badge mb-4">
          <Shield className="h-3 w-3 text-emerald-300" />
          Step 3 of journey · No prompts · business story only
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Jarvis discovery
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          Tell us about your business. Jarvis interviews you, recommends
          improvements with evidence, and prepares a blueprint path — manufacturing
          only after approval and deposit.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Mode: <span className="text-sky-200/90">{llmMode}</span>
          {" · "}
          <Link href="/book" className="text-sky-300 hover:underline">
            Book a consultation
          </Link>
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        {!session ? (
          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">
                Business name
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lanka Textiles"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">
                Email (optional)
              </label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">
                Describe your business
              </label>
              <textarea
                className="textarea"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={10}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || story.trim().length < 40}
              onClick={start}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                </>
              ) : (
                <>
                  Start discovery
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="card text-sm">
              <p>
                Session <span className="font-mono text-sky-300">{session.id}</span>
              </p>
              <p className="muted mt-1">
                Industry: {session.industry || "—"} · Confidence:{" "}
                {Math.round((session.confidence || 0) * 100)}%
              </p>
            </div>

            {done ? (
              <div className="card space-y-3">
                <h2 className="text-xl font-semibold">Blueprint draft ready</h2>
                <p className="text-sm text-[var(--muted)]">
                  Consulting package prepared. Factory is{" "}
                  <strong className="text-white">not</strong> started — commercial
                  approval and deposit come next.
                </p>
                {done.essential?.length ? (
                  <div>
                    <p className="text-xs uppercase text-[var(--muted)]">Essential</p>
                    <p className="text-sm">{done.essential.join(", ")}</p>
                  </div>
                ) : null}
                {done.recommended?.length ? (
                  <div>
                    <p className="text-xs uppercase text-[var(--muted)]">
                      Recommended
                    </p>
                    <p className="text-sm">{done.recommended.join(", ")}</p>
                  </div>
                ) : null}
                {done.total != null ? (
                  <p className="text-sm">
                    Indicative commercial total:{" "}
                    <strong>${done.total.toLocaleString()}</strong> (subject to
                    proposal review)
                  </p>
                ) : null}
                <p className="text-xs text-[var(--muted)]">
                  Path: {done.llmPath || "deterministic"} · factory still locked
                  until approval + deposit.
                </p>
                {done.engagementId ? (
                  <a
                    className="btn btn-primary"
                    href={`${ENTERPRISE_URL}/api/consulting?id=${done.engagementId}&format=html`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open executive briefing (HTML)
                  </a>
                ) : null}
                <Link href="/" className="btn btn-ghost">
                  Back to home
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold">Discovery interview</h2>
                {(session.next || []).length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--muted)]">
                      Confidence threshold met. Generate recommendations and package.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() => finishPackage(session.id)}
                    >
                      {busy ? "Working…" : "Generate blueprint package"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(session.next || []).map((q) => (
                      <div key={q.id}>
                        <label className="mb-1 block text-sm text-[var(--muted)]">
                          {q.prompt}
                        </label>
                        <textarea
                          className="textarea"
                          value={answers[q.id] || ""}
                          onChange={(e) =>
                            setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={submitAnswers}
                    >
                      {busy ? "Saving…" : "Continue"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
