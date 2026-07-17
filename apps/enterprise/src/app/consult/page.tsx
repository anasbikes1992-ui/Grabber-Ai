"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PageHeader, Section, StatusPill } from "@/components/ui";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { createFadeUpVariant, createStaggerVariant } from "@/lib/motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const DEFAULT_STORY = `I own a textile raw material wholesale business in Sri Lanka. I want to modernize my operations. Help me design the best system for my business - act as senior consultant, industry specialist, architect, UX designer, CTO, security expert, and operations manager. Interview me thoroughly. Challenge assumptions. Recommend best practices. Separate essential from optional. Produce a complete business blueprint before any software is designed.`;

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

function JarvisWorldPanel({
  prefersReducedMotion,
  engagementId,
}: {
  prefersReducedMotion: boolean;
  engagementId?: string;
}) {
  const orbitDuration = prefersReducedMotion ? "0s" : "18s";
  const pulseDuration = prefersReducedMotion ? "0s" : "3.5s";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-(--border) bg-black/30 p-4">
      <div
        className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.35), transparent 70%)",
          filter: "blur(8px)",
          animation: `jarvisPulse ${pulseDuration} ease-in-out infinite`,
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-14 -right-10 h-44 w-44 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(167,139,250,0.32), transparent 70%)",
          filter: "blur(10px)",
          animation: `jarvisOrbit ${orbitDuration} linear infinite`,
        }}
      />

      <div className="relative z-10">
        <p className="text-xs uppercase tracking-[0.18em] text-(--muted)">
          Jarvis 3D consultant world
        </p>
        <h3 className="mt-2 text-lg font-semibold">Strategic intelligence sphere</h3>
        <p className="mt-2 text-sm text-(--muted)">
          This node is exclusive to consulting. It maps business context,
          constraints, and executive priorities before anything reaches factory.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {[
            "Industry graph",
            "Risk lattice",
            "Commercial sim",
            "Execution path",
          ].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-center"
            >
              {chip}
            </span>
          ))}
        </div>
        {engagementId ? (
          <p className="mt-3 text-xs text-(--muted)">
            Synced engagement: {engagementId}
          </p>
        ) : null}
      </div>
    </div>
  );
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
  const prefersReducedMotion = useReducedMotion() ?? true;
  const containerVariant = useMemo(
    () =>
      createStaggerVariant(
        prefersReducedMotion,
        0.08,
        DESIGN_TOKENS.motion.duration.fast,
      ),
    [prefersReducedMotion],
  );
  const cardVariant = useMemo(
    () =>
      createFadeUpVariant(
        prefersReducedMotion,
        18,
        DESIGN_TOKENS.motion.duration.base,
      ),
    [prefersReducedMotion],
  );

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
    <motion.div variants={containerVariant} initial="hidden" animate="visible">
      <style jsx>{`
        @keyframes jarvisOrbit {
          0% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(180deg) translateY(-6px); }
          100% { transform: rotate(360deg) translateY(0); }
        }
        @keyframes jarvisPulse {
          0%, 100% { transform: scale(1); opacity: 0.72; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
      <PageHeader
        title="Jarvis Consulting"
        description="Describe your business - not software. Jarvis interviews, benchmarks patterns, identifies gaps, and shapes the blueprint before any factory work starts."
        actions={
          <>
            <Link href="/signup" className="btn btn-primary">
              Sign up
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Login
            </Link>
          </>
        }
      />

      <motion.div
        variants={cardVariant}
        className="mb-4 grid gap-4 rounded-2xl border border-(--border) bg-linear-to-br from-sky-500/10 via-transparent to-violet-500/10 p-4 lg:grid-cols-[1.4fr_1fr]"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">
            Unified consulting to factory flow
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            One operating system, connected use-cases
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-(--muted)">
            Start in consulting, structure the business blueprint, and move into delivery only when the engagement is ready.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/portal" className="btn btn-primary">
              Open client portal
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Owner sign in
            </Link>
          </div>
        </div>
        <JarvisWorldPanel
          prefersReducedMotion={prefersReducedMotion}
          engagementId={engagement?.id}
        />
      </motion.div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <motion.div variants={cardVariant}>
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
            {busy ? "..." : "Start discovery interview"}
          </button>
        </Section>
      </motion.div>

      {engagement ? (
        <motion.div variants={containerVariant} className="mt-4 space-y-4">
          <motion.div variants={cardVariant}>
            <Section title="Session">
              <div className="flex flex-wrap gap-2 text-sm">
                <StatusPill status={engagement.consulting?.stage || "discovery"} />
                <span className="muted">
                  Confidence: {Math.round((engagement.consulting?.confidence || 0) * 100)}% /
                  {Math.round((engagement.consulting?.confidence_threshold || 0.8) * 100)}%
                </span>
                <span className="muted text-xs">{engagement.id}</span>
              </div>
              <p className="mt-2 text-xs text-(--muted)">
                {engagement.consulting?.legal_boundary}
              </p>
            </Section>
          </motion.div>

          <motion.div variants={cardVariant}>
            <Section title="Interview (Jarvis asks - you answer)">
              {nextQs.length === 0 ? (
                <p className="text-sm text-emerald-300">
                  Discovery threshold met (or no pending). Run intelligence to package.
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
                          setAnswers((current) => ({
                            ...current,
                            [q.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                  <button className="btn btn-primary" disabled={busy} onClick={submitAnswers}>
                    Submit answers
                  </button>
                </div>
              )}
            </Section>
          </motion.div>

          <motion.div variants={cardVariant}>
            <Section title="Consulting pipeline">
              <button className="btn btn-primary" disabled={busy} onClick={runRest}>
                Run intelligence to package
              </button>
              <p className="mt-2 text-xs muted">
                Blocked until discovery confidence reaches threshold. Factory work stays gated.
              </p>
            </Section>
          </motion.div>

          {pkg ? (
            <motion.div variants={cardVariant}>
              <Section title="Solution package (pre-factory)">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-(--muted)">Business</p>
                    <p>{pkg.business?.executive_summary || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-(--muted)">Essential</p>
                    <p>
                      {pkg.functional?.requirements
                        ?.filter((r: Any) => r.class === "essential")
                        .map((r: Any) => r.capability)
                        .join(", ") || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-(--muted)">Recommended</p>
                    <p>
                      {pkg.functional?.requirements
                        ?.filter((r: Any) => r.class === "recommended")
                        .map((r: Any) => r.capability)
                        .slice(0, 6)
                        .join(", ") || "-"}
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
                      <p>-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase text-(--muted)">Commercial total</p>
                    <p>
                      {pkg.commercial?.pricing?.total != null
                        ? `$${pkg.commercial.pricing.total.toLocaleString()}`
                        : "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-(--muted)">
                      Continue with the same engagement
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link href={`/portal?client=${encodeURIComponent(name)}`} className="btn btn-primary">
                        Client portal view
                      </Link>
                      <Link href="/login" className="btn btn-ghost">
                        Sign in to internal workspace
                      </Link>
                    </div>
                  </div>
                </div>
              </Section>
            </motion.div>
          ) : null}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
