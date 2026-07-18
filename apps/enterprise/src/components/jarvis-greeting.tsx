"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Volume2, VolumeX } from "lucide-react";

const GREETING =
  "Hi, I'm Jarvis, your AI business consultant at Grabber Studio. Here's how this works: you tell me about your business in plain words — no tech required. I'll interview you like a senior consultant, benchmark your industry, and produce a complete blueprint with clear ROI. Nothing gets built until you approve the plan and the commercials. Ready when you are — just describe your business below, and I'll take it from there.";

const STEPS = [
  { n: "1", label: "Describe your business" },
  { n: "2", label: "I interview you" },
  { n: "3", label: "Blueprint & ROI" },
  { n: "4", label: "Proposal you approve" },
  { n: "5", label: "We build & support" },
];

export function JarvisGreeting() {
  const [speaking, setSpeaking] = useState(false);
  const [shown, setShown] = useState("");
  const autoTried = useRef(false);

  // Typewriter reveal so the greeting feels like Jarvis is talking.
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setShown(GREETING.slice(0, i));
      if (i >= GREETING.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, []);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(GREETING);
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  // Try to greet aloud once the visitor first interacts (browsers block
  // audio before a user gesture). Silent no-op if speech is unavailable.
  useEffect(() => {
    function onFirstGesture() {
      if (autoTried.current) return;
      autoTried.current = true;
      speak();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    }
    window.addEventListener("pointerdown", onFirstGesture);
    window.addEventListener("keydown", onFirstGesture);
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
      window.speechSynthesis?.cancel();
    };
  }, [speak]);

  return (
    <div className="card relative mb-4 overflow-hidden">
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(56,189,248,0.16), transparent 70%)" }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#05070d] ${speaking ? "animate-pulse" : ""}`}
          style={{
            background: "linear-gradient(135deg, rgba(56,189,248,0.95), rgba(167,139,250,0.95))",
            boxShadow: "var(--glow)",
          }}
          aria-hidden
        >
          <Sparkles className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="eyebrow">Jarvis · your consultant</div>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={speaking ? stop : speak}
              aria-label={speaking ? "Stop Jarvis" : "Hear Jarvis greet you"}
            >
              {speaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {speaking ? "Stop" : "Hear Jarvis"}
            </button>
          </div>

          <p className="mt-2 min-h-[3.5rem] text-sm leading-relaxed text-[var(--text)]">
            {shown}
            {shown.length < GREETING.length ? (
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-sky-400" />
            ) : null}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-(--border) bg-white/[0.02] px-2.5 py-1 text-xs">
                  <span className="text-sky-400">{s.n}</span>
                  <span className="text-(--muted)">{s.label}</span>
                </span>
                {i < STEPS.length - 1 ? <span className="text-(--muted)">→</span> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
