"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, Mic, MicOff, Send, Volume2, VolumeX, Sparkles } from "lucide-react";

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

type JarvisQuickAction = {
  label: string;
  href: string;
};

type JarvisContext = {
  label: string;
  summary: string;
  knowledge: string;
  nextStep: string;
  quickActions: JarvisQuickAction[];
};

const ROUTES = [
  { key: "business", href: "/business" },
  { key: "ops", href: "/ops" },
  { key: "delivery", href: "/delivery" },
  { key: "marketing", href: "/marketing" },
  { key: "portal", href: "/portal" },
  { key: "governance", href: "/governance" },
  { key: "kpis", href: "/kpis" },
  { key: "consult", href: "/consult" },
] as const;

const KNOWLEDGE_TOPICS = [
  {
    terms: ["wholesale", "inventory", "warehouse", "receiving", "credit", "textile"],
    reply:
      "Wholesale operations need strong stock control, receiving discipline, credit limits, and clean order visibility before automation scales.",
  },
  {
    terms: ["governance", "approval", "deposit", "factory"],
    reply:
      "Governance exists so the consulting output becomes a validated delivery package before the factory begins any build work.",
  },
  {
    terms: ["delivery", "ops", "kpi", "portal", "marketing"],
    reply:
      "Enterprise pages reflect the operating model: lead intake, discovery, delivery, and measured execution across the business OS.",
  },
] as const;

const PAGE_CONTEXTS: Array<{ match: string; context: JarvisContext }> = [
  {
    match: "/consult",
    context: {
      label: "Jarvis consulting",
      summary:
        "Consulting workspace open. Capture the client story, ask follow-up questions, and shape a blueprint before factory work starts.",
      knowledge:
        "Knowledge: discovery-first consulting, industry patterns, and governed handoff into delivery.",
      nextStep:
        "Use this workspace to finish discovery, review the package, and move into approval only when confidence is high.",
      quickActions: [
        { label: "Open business", href: "/business" },
        { label: "Review governance", href: "/governance" },
      ],
    },
  },
  {
    match: "/business",
    context: {
      label: "Business intake",
      summary:
        "Business workspace open. Review leads, engagements, and consulting progression.",
      knowledge:
        "Knowledge: leads should become engagements only after the client story and operating pain are clear.",
      nextStep:
        "Open a live lead to continue discovery or move the best opportunities into the consulting flow.",
      quickActions: [
        { label: "Open consult", href: "/consult" },
        { label: "Go portal", href: "/portal" },
      ],
    },
  },
  {
    match: "/ops",
    context: {
      label: "Operations",
      summary:
        "Operations view open. Track execution and delivery readiness.",
      knowledge:
        "Knowledge: operations pages should expose blockers, throughput, and the current state of delivery readiness.",
      nextStep:
        "Use ops to confirm the team, the blockers, and what must happen before the delivery stream advances.",
      quickActions: [
        { label: "Check delivery", href: "/delivery" },
        { label: "Review KPIs", href: "/kpis" },
      ],
    },
  },
  {
    match: "/delivery",
    context: {
      label: "Delivery",
      summary:
        "Delivery module open. Confirm workstream status and blockers.",
      knowledge:
        "Knowledge: delivery should stay tied to governance-approved scope and visible milestones.",
      nextStep:
        "Review workstream status, unblock the pipeline, and keep the client-facing promise aligned with execution.",
      quickActions: [
        { label: "Open governance", href: "/governance" },
        { label: "View portal", href: "/portal" },
      ],
    },
  },
  {
    match: "/marketing",
    context: {
      label: "Marketing intelligence",
      summary:
        "Marketing intelligence open. Shape positioning, pipeline, and client narrative.",
      knowledge:
        "Knowledge: the story should sell certainty, not generic AI services.",
      nextStep:
        "Use this page to refine messaging that connects the business pain to the consulting outcome.",
      quickActions: [
        { label: "Back to business", href: "/business" },
        { label: "Open consult", href: "/consult" },
      ],
    },
  },
  {
    match: "/portal",
    context: {
      label: "Client portal",
      summary:
        "Client portal open. Review engagement state and client-facing progress.",
      knowledge:
        "Knowledge: the portal is where the client sees progress, approvals, and the delivery story without internal jargon.",
      nextStep:
        "Use the portal to keep the client informed and keep the next approval step visible.",
      quickActions: [
        { label: "Open business", href: "/business" },
        { label: "Review KPIs", href: "/kpis" },
      ],
    },
  },
  {
    match: "/governance",
    context: {
      label: "Governance",
      summary:
        "Governance workspace open. Review approvals, guardrails, and readiness.",
      knowledge:
        "Knowledge: approval gates protect the platform from premature build work and unsupported scope.",
      nextStep:
        "Check whether the project is ready for approval, deposit, or a governance exception.",
      quickActions: [
        { label: "Open consult", href: "/consult" },
        { label: "View delivery", href: "/delivery" },
      ],
    },
  },
  {
    match: "/kpis",
    context: {
      label: "KPIs",
      summary:
        "KPI view open. Track delivery quality, client outcomes, and operating signals.",
      knowledge:
        "Knowledge: metrics should measure decision quality, delivery confidence, and client impact — not just file counts.",
      nextStep:
        "Use KPIs to decide what to improve next in the consulting and delivery flow.",
      quickActions: [
        { label: "Open ops", href: "/ops" },
        { label: "Open portal", href: "/portal" },
      ],
    },
  },
] as const;

const DEFAULT_CONTEXT: JarvisContext = {
  label: "Enterprise command center",
  summary:
    "Enterprise command center. Say go to business, go to ops, go to delivery, or read page.",
  knowledge:
    "Knowledge: consulting intelligence, client operations, governed delivery, and measurable execution.",
  nextStep:
    "Ask Jarvis what this page does or move into business intake and live discovery.",
  quickActions: [
    { label: "Go business", href: "/business" },
    { label: "Open consult", href: "/consult" },
  ],
};

function matchRoute(text: string) {
  const lower = text.toLowerCase();
  return ROUTES.find((item) => lower.includes(item.key)) || null;
}

function resolveContext(pathname: string): JarvisContext {
  const match = PAGE_CONTEXTS.find((item) => pathname.startsWith(item.match));
  return match?.context ?? DEFAULT_CONTEXT;
}

function resolveKnowledgeReply(command: string, context: JarvisContext) {
  const lower = command.toLowerCase();
  const topic = KNOWLEDGE_TOPICS.find((item) =>
    item.terms.some((term) => lower.includes(term)),
  );

  if (topic) {
    return topic.reply;
  }

  if (lower.includes("what can you do") || lower.includes("help me")) {
    return `${context.summary} Jarvis can also explain the client story, surface next steps, and route you to business, ops, delivery, or governance.`;
  }

  if (lower.includes("what is enterprise") || lower.includes("enterprise vs grabber")) {
    return "Grabber website is the public acquisition surface. Enterprise is the consulting and operations workspace. Jarvis OS is the premium experience layer.";
  }

  if (lower.includes("what next") || lower.includes("next step")) {
    return context.nextStep;
  }

  return `${context.summary} ${context.knowledge}`;
}

function pageSummary(pathname: string) {
  return resolveContext(pathname).summary;
}

export function JarvisVoiceDock() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("Voice unavailable in this browser.");
  const [reply, setReply] = useState("Say: go to business, go to ops, or read page.");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startingRef = useRef(false);

  const context = useMemo(() => resolveContext(pathname), [pathname]);
  const summary = useMemo(() => pageSummary(pathname), [pathname]);

  useEffect(() => {
    setReply(summary);
  }, [summary]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  const handleCommand = useCallback((command: string) => {
    const text = command.toLowerCase();
    if (text.includes("stop voice") || text.includes("stop speaking")) {
      stopSpeech();
      setReply("Voice output stopped.");
      return;
    }

    if (text.includes("read page") || text.includes("summarize page")) {
      setReply(summary);
      speak(summary);
      return;
    }

    if (text.includes("what can you do") || text.includes("help me")) {
      const help = `${context.summary} Jarvis can also explain the client story, surface the next step, or route you into the consulting and operations flow.`;
      setReply(help);
      speak(help);
      return;
    }

    if (text.includes("what is enterprise") || text.includes("enterprise vs grabber")) {
      const explanation =
        "Grabber website is the public acquisition surface. Enterprise is the consulting and operations workspace. Jarvis OS is the premium experience layer.";
      setReply(explanation);
      speak(explanation);
      return;
    }

    if (text.includes("what next") || text.includes("next step")) {
      setReply(context.nextStep);
      speak(context.nextStep);
      return;
    }

    const knowledgeReply = resolveKnowledgeReply(text, context);
    if (knowledgeReply !== `${context.summary} ${context.knowledge}`) {
      setReply(knowledgeReply);
      speak(knowledgeReply);
      return;
    }

    const matched = matchRoute(text);
    if (matched) {
      setReply(`Navigating to ${matched.key}.`);
      router.push(matched.href);
      return;
    }

    const fallback = "Command heard. Try: go to business, go to ops, or read page.";
    setReply(fallback);
    speak(fallback);
  }, [context, router, speak, stopSpeech, summary]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as BrowserWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }

    const recognizer = new Ctor();
    recognizer.lang = "en-US";
    recognizer.continuous = false;
    recognizer.interimResults = false;

    recognizer.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() || "";
      if (!transcript) return;
      handleCommand(transcript);
    };
    recognizer.onerror = () => {
      startingRef.current = false;
      setListening(false);
    };
    recognizer.onend = () => {
      startingRef.current = false;
      setListening(false);
    };

    recognitionRef.current = recognizer;
    setSupported(true);
    setNotice("Voice ready. Ask about this page or say what next.");

    return () => {
      recognizer.stop();
      recognitionRef.current = null;
    };
  }, [handleCommand]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleListening() {
    if (!supported || !recognitionRef.current || startingRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      startingRef.current = false;
      return;
    }
    try {
      startingRef.current = true;
      recognitionRef.current.start();
      setListening(true);
    } catch {
      startingRef.current = false;
      setListening(false);
      setNotice("Microphone blocked. Allow mic permission and try again.");
    }
  }

  function submitText() {
    const trimmed = input.trim();
    if (!trimmed) return;
    handleCommand(trimmed);
    setInput("");
  }

  return (
    <div className="jarvis-voice-dock">
      <button
        ref={triggerRef}
        type="button"
        className="jarvis-voice-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle Jarvis voice"
        aria-expanded={open}
        aria-controls="jarvis-voice-panel-enterprise"
      >
        <Sparkles className="h-4 w-4" />
        Jarvis
      </button>

      {open ? (
        <div
          id="jarvis-voice-panel-enterprise"
          className="jarvis-voice-panel"
          role="dialog"
          aria-label="Jarvis voice assistant"
          aria-live="polite"
        >
          <p className="jarvis-voice-title">
            <MessageCircle className="h-4 w-4" /> Enterprise Voice Assistant
          </p>
          <p className="jarvis-voice-note">{context.label}</p>
          <p className="jarvis-voice-note">{notice}</p>
          <p className="jarvis-voice-reply">{reply}</p>
          <p className="jarvis-voice-note">{context.knowledge}</p>

          <div className="jarvis-voice-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={toggleListening}
              disabled={!supported}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {listening ? "Stop" : "Listen"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => (speaking ? stopSpeech() : speak(summary))}
              aria-pressed={speaking}
              aria-label={speaking ? "Mute speech" : "Read page summary"}
            >
              {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {speaking ? "Mute" : "Read"}
            </button>
          </div>

          <div className="jarvis-voice-actions">
            {context.quickActions.map((action) => (
              <button
                key={action.href}
                type="button"
                className="btn btn-ghost"
                onClick={() => router.push(action.href)}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="jarvis-voice-input-row">
            <input
              ref={inputRef}
              className="input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type command"
              aria-label="Jarvis command"
              onKeyDown={(event) => {
                if (event.key === "Enter") submitText();
              }}
            />
            <button type="button" className="btn btn-primary" onClick={submitText}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
