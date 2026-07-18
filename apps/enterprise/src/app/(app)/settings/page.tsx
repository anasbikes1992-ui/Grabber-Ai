"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Empty, Metric, PageHeader, Section, StatusPill } from "@/components/ui";

type Integration = {
  key: string;
  label: string;
  group: string;
  purpose: string;
  required: boolean;
  configured: boolean;
};

type Settings = {
  integrations: Integration[];
  llm: { available: boolean; model: string; key_present: boolean };
  system: {
    environment: string;
    region: string;
    commit: string | null;
    supabase_configured: boolean;
    durable_store?: { engagements: boolean; deposits: boolean };
  };
};

export default function SettingsPage() {
  const [data, setData] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings").then((r) => r.json());
      if (!res.ok) throw new Error(res.error || "Failed to load settings");
      setData(res as Settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, Integration[]>();
    for (const i of data?.integrations ?? []) {
      const list = map.get(i.group) ?? [];
      list.push(i);
      map.set(i.group, list);
    }
    return [...map.entries()];
  }, [data]);

  const configured = data?.integrations.filter((i) => i.configured).length ?? 0;
  const total = data?.integrations.length ?? 0;
  const missingRequired = data?.integrations.filter((i) => i.required && !i.configured) ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="System"
        title="Settings & monitoring"
        description="Connections, API keys, and system health. Keys are managed as environment variables for security — this page shows what's configured, never the values."
        actions={
          <button className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
            {loading ? "Checking…" : "Refresh"}
          </button>
        }
      />

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid-metrics mb-6">
        <Metric
          label="Jarvis LLM"
          value={data?.llm.available ? "Online" : "Offline"}
          hint={data?.llm.model}
        />
        <Metric label="Integrations" value={`${configured}/${total}`} hint="configured" />
        <Metric
          label="Environment"
          value={data?.system.environment ?? "—"}
          hint={data?.system.region}
        />
        <Metric
          label="Database"
          value={data?.system.supabase_configured ? "Connected" : "Not set"}
          hint={data?.system.commit ? `build ${data.system.commit}` : undefined}
        />
        <Metric
          label="Durable store"
          value={
            data?.system.durable_store?.engagements && data.system.durable_store.deposits
              ? "Active"
              : data?.system.durable_store?.engagements || data?.system.durable_store?.deposits
                ? "Partial"
                : "Not set"
          }
          hint="engagements + deposits tables"
        />
      </div>

      {missingRequired.length > 0 ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <span className="font-medium">Action needed:</span> set{" "}
          {missingRequired.map((m) => (
            <code key={m.key} className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-xs">
              {m.key}
            </code>
          ))}{" "}
          in your hosting environment, then redeploy.
        </div>
      ) : null}

      <div className="grid gap-4">
        {groups.length === 0 && !loading ? (
          <Empty>No integrations reported.</Empty>
        ) : (
          groups.map(([group, items]) => (
            <Section key={group} title={group}>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Integration</th>
                      <th>Purpose</th>
                      <th>Environment variable</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.key}>
                        <td className="font-medium">
                          {i.label}
                          {i.required ? (
                            <span className="ml-2 text-xs text-(--muted)">required</span>
                          ) : null}
                        </td>
                        <td className="muted">{i.purpose}</td>
                        <td>
                          <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">
                            {i.key}
                          </code>
                        </td>
                        <td>
                          <StatusPill status={i.configured ? "configured" : "not set"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ))
        )}
      </div>

      <p className="mt-4 text-xs text-(--muted)">
        To add or rotate a key: add the environment variable in your hosting
        provider (Vercel → Settings → Environment Variables), then redeploy. Keys
        are never stored in the database or shown here.
      </p>
    </div>
  );
}
