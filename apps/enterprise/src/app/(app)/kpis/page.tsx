"use client";

import { useCallback, useEffect, useState } from "react";
import { Metric, PageHeader, Section } from "@/components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type K = any;

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
          <pre className="overflow-auto rounded-lg bg-black/30 p-3 text-xs">
            {JSON.stringify(kpis?.finance || {}, null, 2)}
          </pre>
        </Section>
        <Section title="Customer success">
          <pre className="overflow-auto rounded-lg bg-black/30 p-3 text-xs">
            {JSON.stringify(kpis?.customer_success || {}, null, 2)}
          </pre>
        </Section>
        <Section title="Marketing">
          <pre className="overflow-auto rounded-lg bg-black/30 p-3 text-xs">
            {JSON.stringify(kpis?.marketing || {}, null, 2)}
          </pre>
        </Section>
        <Section title="Experience">
          <pre className="overflow-auto rounded-lg bg-black/30 p-3 text-xs">
            {JSON.stringify(
              {
                experience: kpis?.experience,
                quality: kpis?.quality,
                at: kpis?.at,
              },
              null,
              2,
            )}
          </pre>
        </Section>
      </div>
    </div>
  );
}
