"use client";

import { useCallback, useEffect, useState } from "react";
import { Empty, PageHeader, Section, StatusPill } from "@/components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Campaign = any;

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [name, setName] = useState("Q3 Factory Launch");
  const [industry, setIndustry] = useState("hospitality");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/marketing").then((r) => r.json());
    if (res.ok) {
      setCampaigns(res.campaigns || []);
      setStages(res.stages || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: object) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Marketing Intelligence"
        description="Milestone 6 — separate product: trends → competitors → keywords → plan → create → human approval → publish → analytics. Never mixed into Product Factory."
      />

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <Section title="New campaign">
        <div className="flex flex-wrap gap-2">
          <input
            className="input max-w-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input max-w-xs"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="industry"
          />
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void post({ action: "create", name, industry })}
          >
            Create
          </button>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              void post({ action: "run_pipeline", name, industry })
            }
          >
            {busy ? "Running…" : "Run full pipeline"}
          </button>
        </div>
        {stages.length ? (
          <p className="mt-3 text-xs muted">
            Pipeline: {stages.join(" → ")}
          </p>
        ) : null}
      </Section>

      <div className="mt-4 space-y-3">
        {campaigns.length === 0 ? (
          <Empty>No campaigns. Run the full pipeline to seed content.</Empty>
        ) : (
          campaigns.map((c) => (
            <Section key={c.id} title={c.name}>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusPill status={c.stage} />
                <span className="muted text-sm">{c.industry}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["trends", "Trends"],
                    ["competitors", "Competitors"],
                    ["keywords", "Keywords"],
                    ["plan", "Plan"],
                    ["create_content", "Create"],
                    ["publish", "Publish"],
                  ] as const
                ).map(([action, label]) => (
                  <button
                    key={action}
                    className="btn btn-ghost text-xs"
                    disabled={busy}
                    onClick={() => void post({ action, id: c.id })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {c.content_items?.length ? (
                <div className="mt-3 space-y-2">
                  {c.content_items.map(
                    (item: {
                      id: string;
                      title: string;
                      platform: string;
                      status: string;
                    }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                      >
                        <span>
                          {item.platform}: {item.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusPill status={item.status} />
                          {item.status === "draft" ? (
                            <button
                              className="btn btn-ghost text-xs"
                              onClick={() =>
                                void post({
                                  action: "approve",
                                  id: c.id,
                                  item_id: item.id,
                                })
                              }
                            >
                              Approve
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : null}
              {c.analytics ? (
                <p className="mt-3 text-sm muted">
                  Reach {c.analytics.reach} · engagement{" "}
                  {Math.round((c.analytics.engagement_rate || 0) * 1000) / 10}% ·
                  leads {c.analytics.leads_attributed}
                </p>
              ) : null}
              {c.trends?.length ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-sky-300">
                    Research snapshot
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-black/30 p-3 text-xs">
                    {JSON.stringify(
                      {
                        trends: c.trends,
                        competitors: c.competitors,
                        keywords: c.keywords,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              ) : null}
            </Section>
          ))
        )}
      </div>
    </div>
  );
}
