"use client";

import { useCallback, useEffect, useState } from "react";
import { Empty, PageHeader, Section, StatusPill } from "@/components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Row[]>([]);
  const [engagements, setEngagements] = useState<Row[]>([]);
  const [engagementId, setEngagementId] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [d, e] = await Promise.all([
      fetch("/api/delivery").then((r) => r.json()),
      fetch("/api/engagements").then((r) => r.json()),
    ]);
    if (d.ok) setDeliveries(d.deliveries || []);
    if (e.ok) {
      setEngagements(e.engagements || []);
      if (!engagementId && e.engagements?.[0]) {
        setEngagementId(e.engagements[0].id);
      }
    }
  }, [engagementId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: object) {
    setError("");
    const res = await fetch("/api/delivery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    if (!res.ok) {
      setError(res.error || "failed");
      return;
    }
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Delivery & Support"
        description="Milestone 5 — deploy tracking, monitoring, maintenance activation, renewals."
      />

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <Section title="Create delivery record">
        <div className="flex flex-wrap gap-2">
          <select
            className="select max-w-md"
            value={engagementId}
            onChange={(e) => setEngagementId(e.target.value)}
          >
            <option value="">Select engagement</option>
            {engagements.map((e) => (
              <option key={e.id} value={e.id}>
                {e.client_name} ({e.status})
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            disabled={!engagementId}
            onClick={() =>
              void post({ action: "create", engagement_id: engagementId })
            }
          >
            Track delivery
          </button>
        </div>
      </Section>

      <div className="mt-4">
        {deliveries.length === 0 ? (
          <Empty>No delivery records. Create one from a factory-ready engagement.</Empty>
        ) : (
          <div className="space-y-3">
            {deliveries.map((d) => (
              <Section key={d.id} title={`${d.client_name} · ${d.id}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <StatusPill status={d.status} />
                  <span className="muted text-sm">
                    {d.environment} · SLA {d.support?.sla}
                  </span>
                  {d.production_url ? (
                    <a
                      className="text-sm text-sky-300 hover:underline"
                      href={d.production_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {d.production_url}
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    className="input max-w-sm"
                    placeholder="https://app.vercel.app"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      void post({
                        action: "deploy",
                        id: d.id,
                        url: url || `https://${d.client_name.toLowerCase().replace(/\s+/g, "-")}.vercel.app`,
                      })
                    }
                  >
                    Mark deployed
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => void post({ action: "health", id: d.id })}
                  >
                    Health check
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      void post({ action: "maintenance", id: d.id })
                    }
                  >
                    Activate maintenance
                  </button>
                </div>
                <p className="mt-3 text-xs muted">
                  Monitoring:{" "}
                  {d.monitoring?.healthy ? "healthy" : "needs URL"} · last check{" "}
                  {d.monitoring?.last_check} · renewal{" "}
                  {d.maintenance?.renewal_date}
                </p>
              </Section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
