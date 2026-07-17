"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { ENTERPRISE_URL } from "@/lib/config";

const INDUSTRIES = [
  "textile-wholesale",
  "hospitality",
  "retail",
  "construction",
  "logistics",
  "manufacturing",
  "healthcare",
  "other",
];

/**
 * Stage 1 funnel: Book Consultation → lead in Business OS → optional discovery.
 */
export default function BookPage() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    industry: "textile-wholesale",
    preferred_time: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ leadId: string } | null>(null);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${ENTERPRISE_URL}/api/leads`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          name: form.name || form.company,
          source: "website-book",
          score: 70,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not book");
      setDone({ leadId: data.lead.id });
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message}. Start enterprise: npm run enterprise:dev (${ENTERPRISE_URL})`
          : String(err),
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="section pt-12 pb-24">
        <div className="container-x max-w-lg text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <h1 className="mt-4 text-3xl font-semibold">Request received</h1>
          <p className="mt-3 text-[var(--muted)]">
            Reference <span className="font-mono text-sky-300">{done.leadId}</span>.
            We&apos;ll follow up on your preferred time. You can start discovery now
            so Jarvis learns your business immediately.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/consult" className="btn btn-primary">
              Start discovery now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="btn btn-ghost">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section pt-12 pb-24">
      <div className="container-x max-w-xl">
        <p className="badge mb-4">
          <Calendar className="h-3 w-3 text-sky-300" />
          Book consultation
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Talk about your business
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          No software brief required. Tell us who you are and when to talk—or go
          straight into Jarvis discovery after booking.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Your name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Anaz"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Company</label>
              <input
                className="input"
                required
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Lanka Textiles"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Email</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+94 …"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">Industry</label>
              <select
                className="input"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-[var(--muted)]">
                Preferred time
              </label>
              <input
                className="input"
                value={form.preferred_time}
                onChange={(e) => set("preferred_time", e.target.value)}
                placeholder="Weekdays after 4pm Colombo"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted)]">
              What should we know? (optional)
            </label>
            <textarea
              className="textarea"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Brief context about your operations…"
              rows={4}
            />
          </div>
          <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Booking…
              </>
            ) : (
              <>
                Request consultation
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-sm text-[var(--muted)]">
          Prefer to start immediately?{" "}
          <Link href="/consult" className="text-sky-300 hover:underline">
            Open Jarvis discovery
          </Link>
        </p>
      </div>
    </div>
  );
}
