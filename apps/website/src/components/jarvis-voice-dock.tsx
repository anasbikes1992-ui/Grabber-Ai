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
  { key: "home", href: "/" },
  { key: "journey", href: "/journey" },
  { key: "consult", href: "/consult" },
  { key: "book", href: "/book" },
  { key: "pricing", href: "/#pricing" },
  { key: "industries", href: "/#industries" },
] as const;

const KNOWLEDGE_TOPICS = [
  {
    terms: ["wholesale", "inventory", "warehouse", "credit", "receiving", "textile"],
    reply:
      "Wholesale playbooks emphasize stock accuracy, receiving discipline, credit control, and clean order visibility before automation scales.",
  },
  {
    terms: ["consult", "discovery", "blueprint", "requirements"],
    reply:
      "Jarvis discovery should capture the business story first, then turn it into a reviewable blueprint before any software is designed.",
  },
  {
    terms: ["governance", "approval", "deposit", "factory"],
    reply:
      "Governance gates keep the product factory invisible until the solution package is approved and the client is ready to proceed.",
  },
] as const;

const PAGE_CONTEXTS: Array<{ match: string; context: JarvisContext }> = [
  {
    match: "/consult",
    context: {
      label: "Consulting cockpit",
      summary:
        "Consulting cockpit ready. Share your business story and Jarvis will guide discovery with voice and chat.",
      knowledge:
        "Knowledge: discovery, industry playbooks, gap analysis, and governed delivery.",
      nextStep:
        "Use this page to describe the business, then let Jarvis interview you until the blueprint is clear.",
      quickActions: [
        { label: "Start consult", href: "/consult" },
        { label: "See journey", href: "/journey" },
      ],
    },
  },
  {
    match: "/book",
    context: {
      label: "Booking page",
      summary:
        "Booking page open. Pick a consultation slot to move into guided discovery.",
      knowledge:
        "Knowledge: discovery sessions should begin with the business story, not with a feature list.",
      nextStep:
        "Book a slot so Jarvis can continue the interview with live context and cleaner handoff.",
      quickActions: [
        { label: "Open consult", href: "/consult" },
        { label: "View pricing", href: "/#pricing" },
      ],
    },
  },
  {
    match: "/journey",
    context: {
      label: "Journey",
      summary:
        "Journey page open. Review the full path from business discovery to governed delivery.",
      knowledge:
        "Knowledge: the platform only moves into software generation after discovery, approval, and governance are complete.",
      nextStep:
        "Use this page to understand the operating model before you start the consult.",
      quickActions: [
        { label: "Start consult", href: "/consult" },
        { label: "Browse industries", href: "/#industries" },
      ],
    },
  },
] as const;

const DEFAULT_CONTEXT: JarvisContext = {
  label: "Public client gateway",
  summary:
    "Grabber AI Studio website. You can say go to consult, go to journey, or go to book.",
  knowledge:
    "Knowledge: public acquisition surface, consulting-led delivery, and a governed path into the factory.",
  nextStep:
    "Ask Jarvis what this page does or say what next to move into the consult flow.",
  quickActions: [
    { label: "Go consult", href: "/consult" },
    { label: "Read journey", href: "/journey" },
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
    return `${context.summary} Jarvis can also explain the business model, read the page, and route you to the next step.`;
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
  const [notice, setNotice] = useState("Hello, how can the consultant help today?");
  const [reply, setReply] = useState("Say: go to consult, read page, or stop voice.");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startingRef = useRef(false);
  const greetedRef = useRef(false);

  const context = useMemo(() => resolveContext(pathname), [pathname]);
  const summary = useMemo(() => pageSummary(pathname), [pathname]);

  useEffect(() => {
    setReply(summary);
  }, [summary]);

  useEffect(() => {
    const shouldGreet = pathname === "/" || pathname.startsWith("/consult");
    if (!shouldGreet || greetedRef.current || typeof window === "undefined") return;

    const storageKey = "grabber-jarvis-greeted";
    if (window.sessionStorage.getItem(storageKey) === "1") return;

    greetedRef.current = true;
    window.sessionStorage.setItem(storageKey, "1");
    setOpen(true);
    setNotice("Hello, how can the consultant help your business today?");
    setReply("I’m Jarvis. Ask me what next, read page, or tell me about your business.");
  }, [pathname]);

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
      const help = `${context.summary} Jarvis can also explain the current page, summarize the next step, or route you to consult and booking.`;
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

    const fallback = "Command heard. Try: go to consult, go to journey, or read page.";
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
        aria-controls="jarvis-voice-panel-website"
      >
        <Sparkles className="h-4 w-4" />
        Jarvis
      </button>

      {open ? (
        <div
          id="jarvis-voice-panel-website"
          className="jarvis-voice-panel"
          role="dialog"
          aria-label="Jarvis voice assistant"
          aria-live="polite"
        >
          <p className="jarvis-voice-title">
            <MessageCircle className="h-4 w-4" /> Global Voice Assistant
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
