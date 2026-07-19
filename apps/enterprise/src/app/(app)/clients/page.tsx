"use client";

import { useCallback, useEffect, useState } from "react";
import { Empty, Metric, PageHeader, Section, StatusPill } from "@/components/ui";

type AccountRole = "admin" | "client" | "operator" | "viewer";

type Account = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  engagement_id: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
};

type Draft = { role: string; engagement_id: string; name: string; phone: string };

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

export default function ClientsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Draft>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users").then((r) => r.json());
      if (!res.ok) throw new Error(res.error || "Failed to load accounts");
      setAccounts(res.users as Account[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(id: string, patch: Partial<Draft>) {
    setDraft((d) => {
      const acc = accounts.find((a) => a.id === id);
      const base: Draft = d[id] ?? {
        role: acc?.role ?? "client",
        engagement_id: acc?.engagement_id ?? "",
        name: acc?.name ?? "",
        phone: acc?.phone ?? "",
      };
      return { ...d, [id]: { ...base, ...patch } };
    });
  }

  async function save(id: string) {
    const patch = draft[id];
    if (!patch) return;
    setSavingId(id);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: id,
          role: patch.role,
          engagementId: patch.engagement_id,
          name: patch.name,
          phone: patch.phone,
        }),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error || "Save failed");
      setDraft((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingId(null);
    }
  }

  const admins = accounts.filter((a) => a.role === "admin").length;
  const clients = accounts.length - admins;
  const confirmed = accounts.filter((a) => a.confirmed).length;

  return (
    <div>
      <PageHeader
        eyebrow="Access control"
        title="Clients & registrations"
        description="Every account that has registered — name, email, phone, status — and who can see what. Assign a role or link a client to their engagement."
        actions={
          <button className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        }
      />

      <div className="grid-metrics mb-6">
        <Metric label="Accounts" value={accounts.length} />
        <Metric label="Admins" value={admins} />
        <Metric label="Clients" value={clients} />
        <Metric label="Confirmed" value={`${confirmed}/${accounts.length || 0}`} />
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <Section title="Registered accounts">
        {accounts.length === 0 && !loading ? (
          <Empty>No accounts yet. Clients appear here after they register.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Last sign-in</th>
                  <th>Role</th>
                  <th>Engagement</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const d = draft[a.id];
                  const role = d?.role ?? a.role;
                  const eng = d?.engagement_id ?? a.engagement_id ?? "";
                  const name = d?.name ?? a.name ?? "";
                  const phone = d?.phone ?? a.phone ?? "";
                  const dirty = Boolean(d);
                  return (
                    <tr key={a.id}>
                      <td>
                        <input
                          className="input"
                          value={name}
                          placeholder="Add name"
                          onChange={(e) => edit(a.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="font-medium">{a.email ?? "—"}</td>
                      <td>
                        <input
                          className="input"
                          value={phone}
                          placeholder="Add phone"
                          onChange={(e) => edit(a.id, { phone: e.target.value })}
                        />
                      </td>
                      <td>
                        <StatusPill status={a.confirmed ? "confirmed" : "pending"} />
                      </td>
                      <td className="muted">{fmtDate(a.created_at)}</td>
                      <td className="muted">{fmtDate(a.last_sign_in_at)}</td>
                      <td>
                        <select
                          className="input"
                          value={role}
                          onChange={(e) => edit(a.id, { role: e.target.value as AccountRole })}
                        >
                          <option value="client">client</option>
                          <option value="operator">operator</option>
                          <option value="admin">admin</option>
                          <option value="viewer">viewer</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="input"
                          value={eng}
                          placeholder="engagement id"
                          onChange={(e) => edit(a.id, { engagement_id: e.target.value })}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          disabled={!dirty || savingId === a.id}
                          onClick={() => void save(a.id)}
                        >
                          {savingId === a.id ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
