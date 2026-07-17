"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Metric, PageHeader, Section, StatusPill } from "@/components/ui";

type Kpis = {
  sales?: { leads: number; proposals: number; proposal_acceptance_rate: number };
  factory?: { eligible: number; in_factory: number };
  finance?: { revenue_booked: number; gross_margin_pct: number };
  customer_success?: { open_tickets: number; deployments: number };
  marketing?: { campaigns: number; published: number };
};

export default function CommandCenter() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [engagements, setEngagements] = useState<
    { id: string; client_name: string; status: string; governance_stage: string; industry: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [k, e] = await Promise.all([
      fetch("/api/kpis").then((r) => r.json()),
      fetch("/api/engagements").then((r) => r.json()),
    ]);
    if (k.ok) setKpis(k.kpis);
    if (e.ok) setEngagements(e.engagements || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function seedDemo() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Harbor Hotel", industry: "hospitality" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg(
        `Seeded ${data.engagement.client_name} → factory_ready (fingerprint ${data.handoff.fingerprint})`,
      );
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const pct = (n?: number) =>
    n == null ? "—" : `${Math.round(n * 100)}%`;

  return (
    <div>
      <PageHeader
        title="Command Center"
        description="Internal command center. KPI that matters: full journeys lead → proposal → delivery → lessons."
        actions={
          <>
            <Link href="/business" className="btn btn-primary">
              Business OS pipeline
            </Link>
            <button className="btn btn-ghost" disabled={busy} onClick={seedDemo}>
              {busy ? "Seeding…" : "Seed demo engagement"}
            </button>
          </>
        }
      />

      {msg ? (
        <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm">
          {msg}
        </div>
      ) : null}

      <div className="grid-metrics mb-6">
        <Metric label="Leads" value={kpis?.sales?.leads ?? "—"} />
        <Metric label="Proposals" value={kpis?.sales?.proposals ?? "—"} />
        <Metric
          label="Acceptance"
          value={pct(kpis?.sales?.proposal_acceptance_rate)}
        />
        <Metric label="Factory ready" value={kpis?.factory?.eligible ?? "—"} />
        <Metric
          label="Revenue booked"
          value={
            kpis?.finance?.revenue_booked != null
              ? `$${kpis.finance.revenue_booked.toLocaleString()}`
              : "—"
          }
        />
        <Metric
          label="Gross margin"
          value={pct(kpis?.finance?.gross_margin_pct)}
        />
        <Metric
          label="Deployments"
          value={kpis?.customer_success?.deployments ?? "—"}
        />
        <Metric
          label="Marketing pubs"
          value={kpis?.marketing?.published ?? "—"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Programs" className="lg:col-span-1">
          <ul className="space-y-2 text-sm">
            {[
              ["A", "Business OS", "/business"],
              ["B", "Factory Excellence", "/governance"],
              ["C", "Client Portal", "/portal"],
              ["D", "Operations", "/ops"],
              ["E", "Marketing Intelligence", "/marketing"],
              ["F", "Jarvis Experience", "http://127.0.0.1:3001"],
            ].map(([code, label, href]) => (
              <li key={code}>
                <Link
                  href={href}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-white/5"
                >
                  <span>
                    <span className="mr-2 text-sky-400">{code}</span>
                    {label}
                  </span>
                  <span className="text-xs text-[var(--muted)]">open</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Recent engagements" className="lg:col-span-2">
          {engagements.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No engagements yet. Seed a demo or create one in Business OS.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Governance</th>
                </tr>
              </thead>
              <tbody>
                {engagements.slice(0, 8).map((e) => (
                  <tr key={e.id}>
                    <td>
                      <Link
                        href={`/business/${e.id}`}
                        className="text-sky-300 hover:underline"
                      >
                        {e.client_name}
                      </Link>
                    </td>
                    <td className="muted">{e.industry}</td>
                    <td>
                      <StatusPill status={e.status} />
                    </td>
                    <td className="muted">
                      {e.governance_stage?.replaceAll("_", " ")}
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
