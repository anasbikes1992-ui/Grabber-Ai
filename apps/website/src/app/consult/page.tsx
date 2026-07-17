"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Loader2,
  MessageCircle,
  Mic,
  MicOff,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ENTERPRISE_URL } from "@/lib/config";
import { DESIGN_TOKENS, MOTION_EASE } from "@/lib/design-tokens";
import { createFadeUpVariant, createStaggerVariant } from "@/lib/motion";

const EXAMPLE = `I own a textile raw material wholesale business in Sri Lanka. I want to modernize my operations. Help me design the best system for my business. Interview me thoroughly until you understand. Challenge my assumptions. Recommend industry best practices. Separate essential features from optional enhancements. Produce a complete business blueprint before any software is designed.`;

type Scene = {
  id: string;
  label: string;
  hue: number;
  note: string;
  keywords: string[];
};

type JarvisMessage = {
  role: "user" | "jarvis";
  text: string;
};

type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type BrowserWindow = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

const SCENES: Scene[] = [
  {
    id: "global-economy",
    label: "Global Economy",
    hue: 205,
    note: "Tracking macro pressure, supply chain shifts, and demand cycles.",
    keywords: ["global", "economy", "market", "demand", "macro", "currency"],
  },
  {
    id: "operations",
    label: "Operations",
    hue: 155,
    note: "Optimizing process bottlenecks, throughput, and execution rhythm.",
    keywords: ["operations", "workflow", "process", "warehouse", "manufacturing"],
  },
  {
    id: "finance",
    label: "Finance & Risk",
    hue: 25,
    note: "Improving cash flow, controls, receivables, and margin intelligence.",
    keywords: ["finance", "margin", "credit", "cash", "payment", "cost"],
  },
  {
    id: "customer",
    label: "Customer Growth",
    hue: 286,
    note: "Strengthening retention, service reliability, and account expansion.",
    keywords: ["customer", "sales", "crm", "service", "retention", "growth"],
  },
];

const DISCOVERY_TODO = [
  "Describe your business challenge in detail",
  "Share key operational constraints and current tools",
  "Complete Jarvis interview questions",
  "Generate blueprint package and review essentials",
  "Proceed to proposal and governed approval",
];

function sceneByTopic(text: string): Scene {
  const lower = text.toLowerCase();
  for (const scene of SCENES) {
    if (scene.keywords.some((keyword) => lower.includes(keyword))) {
      return scene;
    }
  }
  return SCENES[0];
}

function jarvisReply(input: string, scene: Scene) {
  return `Jarvis focus: ${scene.label}. I will map your note into capabilities, governance gates, and measurable outcomes. Next, provide one concrete example from this area: ${scene.note}`;
}

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
  const [proposalSteps, setProposalSteps] = useState<string[]>([]);
  const [llmMode, setLlmMode] = useState<string>("...");
  const [activeScene, setActiveScene] = useState<Scene>(SCENES[0]);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<JarvisMessage[]>([
    {
      role: "jarvis",
      text: "Welcome. I can listen, translate your context into business capabilities, and prepare your discovery path.",
    },
  ]);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldAnimateScene = !session && !done;
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? true;

  const motionDuration = DESIGN_TOKENS.motion.duration;
  const spring = DESIGN_TOKENS.motion.spring;

  const pageIn = useMemo(
    () =>
      reducedMotion
        ? {
            hidden: { opacity: 1, y: 0 },
            visible: { opacity: 1, y: 0 },
          }
        : {
            hidden: { opacity: 0, y: 24 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: motionDuration.slow / 1000,
                ease: MOTION_EASE,
              },
            },
          },
    [reducedMotion, motionDuration.slow],
  );

  const stagger = useMemo(
    () => createStaggerVariant(reducedMotion, 0.07, motionDuration.fast),
    [reducedMotion, motionDuration.fast],
  );

  const fadeUp = useMemo(
    () => createFadeUpVariant(reducedMotion, 16, motionDuration.base),
    [reducedMotion, motionDuration.base],
  );

  const progress = useMemo(() => {
    const checks = [
      story.trim().length > 80,
      Boolean(name.trim() || email.trim()),
      Boolean(session),
      Object.values(answers).some((value) => value.trim().length > 20),
      Boolean(done),
    ];
    return checks.filter(Boolean).length;
  }, [answers, done, email, name, session, story]);

  const summaryForVoice = useMemo(() => {
    if (done) {
      return `Blueprint package ready. ${done.essential?.length || 0} essential capabilities identified. Continue to proposal and approval.`;
    }
    if (session) {
      return `Discovery session ${session.id} is active. Current confidence is ${Math.round((session.confidence || 0) * 100)} percent.`;
    }
    return "Share your story to start discovery. Jarvis will interview and build your blueprint.";
  }, [done, session]);

  async function refreshLlmStatus() {
    try {
      const response = await fetch(`${ENTERPRISE_URL}/api/consulting`);
      const res = await readApiResponse(response);
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

  useEffect(() => {
    const sourceText = [story, ...Object.values(answers)].join(" ");
    setActiveScene(sceneByTopic(sourceText));
  }, [answers, story]);

  useEffect(() => {
    if (!shouldAnimateScene) return;
    const timer = window.setInterval(() => {
      setActiveScene((current) => {
        const idx = SCENES.findIndex((scene) => scene.id === current.id);
        const next = (idx + 1) % SCENES.length;
        return SCENES[next];
      });
    }, 12000);
    return () => window.clearInterval(timer);
  }, [shouldAnimateScene]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as BrowserWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceNotice("Voice input is unavailable in this browser. Use text or try Chrome/Edge.");
      setVoiceEnabled(false);
      return;
    }

    const recognizer = new Ctor();
    recognizer.lang = "en-US";
    recognizer.continuous = false;
    recognizer.interimResults = false;

    recognizer.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() || "";
      if (!transcript) return;
      if (!session) {
        setStory((prev) => `${prev}\n${transcript}`.trim());
      } else {
        const firstQuestion = session.next?.[0]?.id;
        if (firstQuestion) {
          setAnswers((prev) => ({
            ...prev,
            [firstQuestion]: `${prev[firstQuestion] || ""} ${transcript}`.trim(),
          }));
        }
      }
      setChat((prev) => [
        ...prev,
        { role: "user", text: transcript },
        { role: "jarvis", text: jarvisReply(transcript, activeScene) },
      ]);
    };

    recognizer.onerror = () => {
      setListening(false);
    };

    recognizer.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognizer;
    setVoiceEnabled(true);
    setVoiceNotice("");

    return () => {
      recognizer.stop();
      recognitionRef.current = null;
    };
  }, [activeScene, session]);

  async function start() {
    setBusy(true);
    setError("");
    setDone(null);
    setProposalSteps([]);
    void refreshLlmStatus();
    try {
      const response = await fetch(`${ENTERPRISE_URL}/api/consulting`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "start",
          name: name || "Prospective client",
          email,
          story,
        }),
      });
      const data = await readApiResponse(response);
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
      const response = await fetch(`${ENTERPRISE_URL}/api/consulting`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          id: session.id,
          answers,
        }),
      });
      const data = await readApiResponse(response);
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
        const response = await fetch(`${ENTERPRISE_URL}/api/consulting`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action, id }),
        });
        const data = await readApiResponse(response);
        if (!data.ok) throw new Error(data.error || `${action} failed`);
        if (action === "package") {
          const pkg = data.package || data.engagement?.consulting?.solution_package;
          const steps =
            pkg?.executive_presentation?.sections?.next_steps ||
            data.engagement?.consulting?.executive_presentation?.sections?.next_steps ||
            pkg?.next_steps ||
            [];
          setProposalSteps(Array.isArray(steps) ? steps : []);
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

  function toggleListening() {
    if (!voiceEnabled || !recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      setListening(false);
      setVoiceNotice("Microphone could not start. Check permissions and try again.");
    }
  }

  function speakSummary() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(summaryForVoice);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  function sendChat() {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChat((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "jarvis", text: jarvisReply(trimmed, activeScene) },
    ]);
    setChatInput("");
  }

  return (
    <motion.div
      className="section pt-10 pb-24"
      variants={pageIn}
      initial="hidden"
      animate="visible"
    >
      <div className="container-x max-w-6xl">
        <motion.div
          className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp}>
            <p className="badge mb-4">
              <Shield className="h-3 w-3 text-emerald-300" />
              Step 3 of journey - Jarvis intelligence session
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Jarvis discovery cockpit
            </h1>
            <p className="mt-3 text-[var(--muted)]">
              A living world model tracks economic context, then shifts into your
              business topic as Jarvis interviews you and builds a governed blueprint.
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
                  <label className="mb-1 block text-sm text-[var(--muted)]">Business name</label>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Lanka Textiles"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Email (optional)</label>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-[var(--muted)]">Describe your business</label>
                  <textarea
                    className="textarea"
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    rows={10}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy || story.trim().length < 40}
                    onClick={start}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Starting...
                      </>
                    ) : (
                      <>
                        Start discovery
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={!voiceEnabled}
                    onClick={toggleListening}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {listening ? "Stop voice" : "Voice input"}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={speakSummary}>
                    {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    {speaking ? "Stop voice" : "Speak summary"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                <div className="card text-sm">
                  <p>
                    Session <span className="font-mono text-sky-300">{session.id}</span>
                  </p>
                  <p className="muted mt-1">
                    Industry: {session.industry || "-"} · Confidence: {Math.round((session.confidence || 0) * 100)}%
                  </p>
                </div>

                {done ? (
                  <div className="card space-y-3">
                    <h2 className="text-xl font-semibold">Blueprint draft ready</h2>
                    <p className="text-sm text-[var(--muted)]">
                      Consulting package prepared. Factory is still locked until commercial approval and deposit.
                    </p>
                    {done.essential?.length ? (
                      <div>
                        <p className="text-xs uppercase text-[var(--muted)]">Essential</p>
                        <p className="text-sm">{done.essential.join(", ")}</p>
                      </div>
                    ) : null}
                    {done.recommended?.length ? (
                      <div>
                        <p className="text-xs uppercase text-[var(--muted)]">Recommended</p>
                        <p className="text-sm">{done.recommended.join(", ")}</p>
                      </div>
                    ) : null}
                    {done.total != null ? (
                      <p className="text-sm">
                        Indicative commercial total: <strong>${done.total.toLocaleString()}</strong>
                      </p>
                    ) : null}
                    {proposalSteps.length ? (
                      <div>
                        <p className="text-xs uppercase text-[var(--muted)]">Proposal steps</p>
                        <ol className="mt-2 space-y-2 text-sm">
                          {proposalSteps.slice(0, 6).map((step, index) => (
                            <li
                              key={`${index}-${step}`}
                              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                            >
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                    <p className="text-xs text-[var(--muted)]">
                      Path: {done.llmPath || "deterministic"} · governance still required before factory.
                    </p>
                    {done.engagementId ? (
                      <a
                        className="btn btn-ghost"
                        href={`${ENTERPRISE_URL}/business/${done.engagementId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open enterprise brief
                      </a>
                    ) : null}
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
                          {busy ? "Working..." : "Generate blueprint package"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(session.next || []).map((q) => (
                          <div key={q.id}>
                            <label className="mb-1 block text-sm text-[var(--muted)]">{q.prompt}</label>
                            <textarea
                              className="textarea"
                              value={answers[q.id] || ""}
                              onChange={(e) =>
                                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                            />
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={busy}
                            onClick={submitAnswers}
                          >
                            {busy ? "Saving..." : "Continue"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={!voiceEnabled}
                            onClick={toggleListening}
                          >
                            {listening ? "Stop voice" : "Voice answer"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>

          <motion.div className="space-y-4" variants={fadeUp}>
            <motion.div
              className="card jarvis-world-panel"
              animate={{
                boxShadow: `0 0 0 1px hsla(${activeScene.hue} 90% 65% / 0.24), 0 24px 80px hsla(${activeScene.hue} 90% 50% / 0.18)`,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      duration: motionDuration.slow / 1000,
                      ease: MOTION_EASE,
                    }
              }
            >
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Global to domain context</p>
              <h3 className="mt-2 flex items-center gap-2 text-lg font-semibold">
                <Globe2 className="h-5 w-5 text-sky-300" />
                {activeScene.label}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{activeScene.note}</p>

              <div className="jarvis-world" style={{ ["--scene-hue" as string]: `${activeScene.hue}` }}>
                <motion.div
                  className="jarvis-world-globe"
                  animate={{ rotate: 360 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 70, repeat: Infinity, ease: "linear" }
                  }
                >
                  <motion.div
                    className="jarvis-world-ring"
                    animate={{ rotate: -360 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 24, repeat: Infinity, ease: "linear" }
                    }
                  />
                  <motion.div
                    className="jarvis-world-ring ring-2"
                    animate={{ rotate: 360 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 30, repeat: Infinity, ease: "linear" }
                    }
                  />
                  <div className="jarvis-world-grid" />
                  <div className="jarvis-world-pulse" />
                </motion.div>
              </div>
            </motion.div>

            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MessageCircle className="h-4 w-4 text-sky-300" /> Jarvis chat + voice
              </h3>
              <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
                {chat.map((item, index) => (
                  <div
                    key={`${item.role}-${index}`}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      item.role === "jarvis"
                        ? "border-sky-500/30 bg-sky-500/10"
                        : "border-white/10 bg-black/30"
                    }`}
                  >
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">{item.role}</p>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  className="input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Jarvis how the consultant can help"
                />
                <button type="button" className="btn btn-primary" onClick={sendChat}>
                  Send
                </button>
              </div>
              {voiceNotice ? (
                <p className="mt-2 text-xs text-[var(--muted)]" aria-live="polite">
                  {voiceNotice}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={!voiceEnabled}
                  onClick={toggleListening}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {listening ? "Stop" : "Talk"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={speakSummary}>
                  {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {speaking ? "Mute" : "Read"}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-4 w-4 text-emerald-300" /> Discovery to-do
              </h3>
              <ul className="mt-3 space-y-2">
                {DISCOVERY_TODO.map((item, idx) => {
                  const complete = idx < progress;
                  return (
                    <motion.li
                      key={item}
                      layout={!reducedMotion}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : {
                              type: "spring",
                              stiffness: spring.stiffness,
                              damping: spring.damping,
                            }
                      }
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        complete
                          ? "border-emerald-400/30 bg-emerald-500/10"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${complete ? "text-emerald-300" : "text-slate-500"}`}
                      />
                      {item}
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
