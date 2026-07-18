"use client";

import { useCallback, useEffect, useState } from "react";
import { Empty, Metric, PageHeader, Section } from "@/components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type K = any;

function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function KvList({ data }: { data: Record<string, unknown> | undefined | null }) {
  const entries = Object.entries(data ?? {}).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return <Empty>No data yet.</Empty>;
  return (
    <dl className="grid gap-2">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 border-b border-(--border) pb-2 last:border-0">
          <dt className="text-sm text-(--muted)">{humanize(k)}</dt>
          <dd className="text-sm font-medium tabular-nums">
            {typeof v === "number" ? v.toLocaleString() : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function KpisPage() {
  const [kpis, setKpis] = useState<K | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/kpis").then((r) => r.json());
    if (res.ok) setKpis(res.kpis);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pct = (n?: number) =>
    n == null ? "—" : `${Math.round(n * 100)}%`;

  return (
    <div>
      <PageHeader
        title="Business KPIs"
        description="Whole-company success metrics: sales conversion, discovery, factory throughput, finance, customer success, marketing."
        actions={
          <button className="btn btn-ghost" onClick={() => void load()}>
            Refresh
          </button>
        }
      />

      <div className="grid-metrics mb-6">
        <Metric label="Leads" value={kpis?.sales?.leads ?? "—"} />
        <Metric label="Proposals" value={kpis?.sales?.proposals ?? "—"} />
        <Metric
          label="Lead → proposal"
          value={pct(kpis?.sales?.lead_to_proposal_conversion)}
        />
        <Metric
          label="Proposal accept"
          value={pct(kpis?.sales?.proposal_acceptance_rate)}
        />
        <Metric
          label="Discovery done"
          value={kpis?.discovery?.completed ?? "—"}
          hint={pct(kpis?.discovery?.completion_rate)}
        />
        <Metric label="Factory eligible" value={kpis?.factory?.eligible ?? "—"} />
        <Metric label="In factory" value={kpis?.factory?.in_factory ?? "—"} />
        <Metric
          label="Revenue"
          value={
            kpis?.finance?.revenue_booked != null
              ? `$${kpis.finance.revenue_booked.toLocaleString()}`
              : "—"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Finance">
          <KvList data={kpis?.finance} />
        </Section>
        <Section title="Customer success">
          <KvList data={kpis?.customer_success} />
        </Section>
        <Section title="Marketing">
          <KvList data={kpis?.marketing} />
        </Section>
        <Section title="Experience">
          <KvList data={{ ...(kpis?.experience ?? {}), ...(kpis?.quality ?? {}) }} />
        </Section>
      </div>
    </div>
  );
}
