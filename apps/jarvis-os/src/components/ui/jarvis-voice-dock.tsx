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

const ROUTES = [
  { key: "dashboard", href: "/dashboard" },
  { key: "projects", href: "/projects" },
  { key: "factory", href: "/factory" },
  { key: "intelligence", href: "/intelligence" },
  { key: "deployments", href: "/deployments" },
  { key: "settings", href: "/settings" },
] as const;

function matchRoute(text: string) {
  const lower = text.toLowerCase();
  return ROUTES.find((item) => lower.includes(item.key)) || null;
}

function pageSummary(pathname: string) {
  if (pathname.startsWith("/dashboard")) {
    return "Jarvis dashboard open. Factory health and execution signals are visible.";
  }
  if (pathname.startsWith("/factory")) {
    return "Factory view open. Monitor delivery flow and governed release readiness.";
  }
  return "Jarvis OS is active. Say go to dashboard, go to factory, or read page.";
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
  const [reply, setReply] = useState("Say: go to dashboard, go to factory, or read page.");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startingRef = useRef(false);

  const summary = useMemo(() => pageSummary(pathname), [pathname]);

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

    const matched = matchRoute(text);
    if (matched) {
      setReply(`Navigating to ${matched.key}.`);
      router.push(matched.href);
      return;
    }

    const fallback = "Command heard. Try: go to dashboard, go to factory, or read page.";
    setReply(fallback);
    speak(fallback);
  }, [router, speak, stopSpeech, summary]);

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
    setNotice("Voice ready. Try: go to dashboard.");

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
        aria-controls="jarvis-voice-panel-os"
      >
        <Sparkles className="h-4 w-4" />
        Jarvis
      </button>

      {open ? (
        <div
          id="jarvis-voice-panel-os"
          className="jarvis-voice-panel"
          role="dialog"
          aria-label="Jarvis voice assistant"
          aria-live="polite"
        >
          <p className="jarvis-voice-title">
            <MessageCircle className="h-4 w-4" /> Jarvis OS Voice
          </p>
          <p className="jarvis-voice-note">{notice}</p>
          <p className="jarvis-voice-reply">{reply}</p>

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
