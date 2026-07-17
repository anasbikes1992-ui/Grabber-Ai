"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Empty, Metric, PageHeader, Section, StatusPill } from "@/components/ui";
import {
  EngLike,
  PIPELINE_STAGES,
  money,
  stageOf,
} from "@/components/pipeline";

const INDUSTRIES = [
  "wholesale-distribution",
  "hospitality",
  "restaurants",
  "retail",
  "logistics",
  "healthcare",
  "construction",
  "manufacturing",
  "saas",
];

type Lead = {
  id: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  preferred_time?: string;
  message?: string;
  source?: string;
  status?: string;
};

export default function BusinessOsPage() {
  const [list, setList] = useState<EngLike[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("wholesale-distribution");
  const [email, setEmail] = useState("");
  const [story, setStory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const [e, l] = await Promise.all([
      fetch("/api/engagements").then((r) => r.json()),
      fetch("/api/leads").then((r) => r.json()).catch(() => ({ ok: false })),
    ]);
    if (e.ok) setList(e.engagements || []);
    if (l.ok) setLeads(l.leads || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of PIPELINE_STAGES) c[s.id] = 0;
    for (const eng of list) {
      const st = stageOf(eng);
      c[st] = (c[st] || 0) + 1;
    }
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    if (filter === "all") return list;
    return list.filter((e) => stageOf(e) === filter);
  }, [list, filter]);

  const proposalValue = list.reduce(
    (s, e) => s + (e.commercial?.pricing?.total || 0),
    0,
  );

  async function create() {
    setBusy(true);
    setError("");
    try {
      if (story.trim().length > 20) {
        const res = await fetch("/api/consulting", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "start",
            name,
            industry,
            email,
            story,
          }),
        }).then((r) => r.json());
        if (!res.ok) throw new Error(res.error);
        setToast(`Engagement opened: ${res.engagement.client_name}`);
        window.location.href = `/business/${res.engagement.id}`;
        return;
      }
      const res = await fetch("/api/engagements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, industry, contact_email: email }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setName("");
      setEmail("");
      setStory("");
      await load();
      setToast("Lead created — open it to run discovery.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function convertLead(leadId: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/leads/convert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lead_id: leadId }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      setToast("Lead converted to engagement");
      window.location.href = `/business/${res.engagement.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Business OS"
        description="Lead → discovery → analysis → proposal → approval. Internal CRM for the consulting company."
        actions={
          <Link href="/consult" className="btn btn-ghost text-sm">
            Public consult surface
          </Link>
        }
      />

      {toast ? (
        <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid-metrics mb-6">
        <Metric label="Website leads" value={leads.length} />
        <Metric label="Engagements" value={list.length} />
        <Metric label="In proposal" value={counts.proposal || 0} />
        <Metric label="Pipeline value" value={money(proposalValue)} />
      </div>

      {/* Stage filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn text-xs ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setFilter("all")}
        >
          All ({list.length})
        </button>
        {PIPELINE_STAGES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`btn text-xs ${filter === s.id ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(s.id)}
          >
            {s.label} ({counts[s.id] || 0})
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Section title="New lead / engagement">
          <div className="space-y-3">
            <div>
              <label className="label">Client / company</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lanka Textiles"
              />
            </div>
            <div>
              <label className="label">Industry</label>
              <select
                className="select"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Contact email</label>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@company.com"
              />
            </div>
            <div>
              <label className="label">Business story (optional — starts Jarvis)</label>
              <textarea
                className="textarea text-sm"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Describe operations, pains, goals…"
                rows={4}
              />
            </div>
            <button
              className="btn btn-primary w-full"
              disabled={busy || !name.trim()}
              onClick={create}
            >
              {busy
                ? "Working…"
                : story.trim().length > 20
                  ? "Open consulting engagement"
                  : "Create lead"}
            </button>
          </div>
        </Section>

        <Section title="Pipeline" className="xl:col-span-2">
          {filtered.length === 0 ? (
            <Empty>
              No engagements in this stage. Create a lead or convert a website
              booking.
            </Empty>
          ) : (
            <div className="space-y-2">
              {filtered.map((e) => {
                const st = stageOf(e);
                return (
                  <Link
                    key={e.id}
                    href={`/business/${e.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 transition hover:border-sky-500/30 hover:bg-sky-500/5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sky-100">
                          {e.client_name}
                        </span>
                        <StatusPill status={st} />
                        <span className="text-xs text-[var(--muted)]">
                          {e.industry}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {e.governance_stage?.replaceAll("_", " ")}
                        {e.consulting?.confidence != null
                          ? ` · conf ${Math.round(e.consulting.confidence * 100)}%`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        {money(e.commercial?.pricing?.total)}
                      </div>
                      <div className="text-xs text-[var(--muted)]">open →</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <div className="mt-4">
        <Section title="Website bookings / inbound leads">
          {leads.length === 0 ? (
            <Empty>
              No website leads yet. Use the public site{" "}
              <code className="text-sky-300">/book</code> with enterprise running.
            </Empty>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Industry</th>
                  <th>Contact</th>
                  <th>Preferred</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="font-medium">
                        {l.company || l.name}
                      </div>
                      <div className="text-xs muted">{l.source}</div>
                    </td>
                    <td className="muted text-sm">{l.industry}</td>
                    <td className="text-sm">
                      {l.email}
                      {l.phone ? (
                        <div className="text-xs muted">{l.phone}</div>
                      ) : null}
                    </td>
                    <td className="muted text-xs">{l.preferred_time || "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary text-xs"
                        disabled={busy}
                        onClick={() => convertLead(l.id)}
                      >
                        Convert → engagement
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </div>
  );
}
