"use client";

import { useCallback, useEffect, useState } from "react";
import { Metric, PageHeader, Section, StatusPill } from "@/components/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Snap = any;

export default function OpsPage() {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [tickets, setTickets] = useState<Snap[]>([]);
  const [leads, setLeads] = useState<Snap[]>([]);
  const [leadName, setLeadName] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/ops").then((r) => r.json());
    if (res.ok) {
      setSnap(res.snapshot);
      setTickets(res.tickets || []);
      setLeads(res.leads || []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: object) {
    await fetch("/api/ops", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  return (
    <div>
      <PageHeader
        title="Operations"
        description="Program D — leads, pipeline, capacity, revenue, costs, tickets, renewals, profitability."
      />

      <div className="grid-metrics mb-6">
        <Metric label="Leads" value={snap?.leads ?? "—"} />
        <Metric label="Active projects" value={snap?.active_projects ?? "—"} />
        <Metric
          label="Utilization"
          value={
            snap
              ? `${Math.round((snap.team_capacity?.utilization || 0) * 100)}%`
              : "—"
          }
        />
        <Metric
          label="Revenue booked"
          value={
            snap?.finance?.revenue_booked != null
              ? `$${snap.finance.revenue_booked.toLocaleString()}`
              : "—"
          }
        />
        <Metric
          label="Gross margin"
          value={
            snap?.finance
              ? `${Math.round((snap.finance.gross_margin_pct || 0) * 100)}%`
              : "—"
          }
        />
        <Metric label="Open tickets" value={snap?.open_tickets ?? "—"} />
        <Metric
          label="Maintenance"
          value={snap?.maintenance_contracts ?? "—"}
        />
        <Metric label="Renewals due" value={snap?.renewals_due ?? "—"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Pipeline by status">
          <ul className="space-y-2 text-sm">
            {Object.entries(snap?.pipeline || {}).map(([k, v]) => (
              <li key={k} className="flex justify-between">
                <span className="muted">{k}</span>
                <span>{String(v)}</span>
              </li>
            ))}
            {!snap?.pipeline || Object.keys(snap.pipeline).length === 0 ? (
              <li className="muted">No pipeline data yet.</li>
            ) : null}
          </ul>
        </Section>

        <Section title="Record lead">
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Lead name"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                void post({
                  action: "lead",
                  name: leadName,
                  source: "ops",
                });
                setLeadName("");
              }}
            >
              Add
            </button>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {leads.map((l) => (
              <li key={l.id} className="flex justify-between">
                <span>{l.name}</span>
                <span className="muted">{l.source}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Tickets" className="lg:col-span-2">
          <div className="mb-3 flex gap-2">
            <input
              className="input"
              placeholder="New ticket subject"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                void post({
                  action: "ticket",
                  subject: ticketSubject,
                  client_name: "Internal",
                });
                setTicketSubject("");
              }}
            >
              Open ticket
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Client</th>
                <th>Priority</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.subject}</td>
                  <td className="muted">{t.client_name || "—"}</td>
                  <td className="muted">{t.priority}</td>
                  <td>
                    <StatusPill status={t.status} />
                  </td>
                  <td>
                    {t.status !== "closed" ? (
                      <button
                        className="btn btn-ghost text-xs"
                        onClick={() =>
                          void post({
                            action: "update_ticket",
                            id: t.id,
                            patch: { status: "closed" },
                          })
                        }
                      >
                        Close
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}
