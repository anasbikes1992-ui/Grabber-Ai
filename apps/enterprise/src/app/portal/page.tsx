"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Empty,
  Metric,
  PageHeader,
  Section,
  StatusPill,
} from "@/components/ui";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { createFadeUpVariant, createStaggerVariant } from "@/lib/motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type View = any;

type Tab =
  | "overview"
  | "proposal"
  | "documents"
  | "timeline"
  | "deployments"
  | "support"
  | "meetings";

export default function ClientPortalPage() {
  const searchParams = useSearchParams();
  const [client, setClient] = useState("");
  const [clients, setClients] = useState<string[]>([]);
  const [view, setView] = useState<View | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");
  const [comment, setComment] = useState("");
  const [meetingWhen, setMeetingWhen] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const prefersReducedMotion = useReducedMotion() ?? true;
  const containerVariant = useMemo(
    () =>
      createStaggerVariant(
        prefersReducedMotion,
        0.06,
        DESIGN_TOKENS.motion.duration.fast,
      ),
    [prefersReducedMotion],
  );
  const cardVariant = useMemo(
    () =>
      createFadeUpVariant(
        prefersReducedMotion,
        14,
        DESIGN_TOKENS.motion.duration.base,
      ),
    [prefersReducedMotion],
  );

  const loadClients = useCallback(async () => {
    const res = await fetch("/api/portal").then((r) => r.json());
    if (res.ok) setClients(res.clients || []);
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    const seededClient = searchParams.get("client") || "";
    if (!seededClient.trim()) return;
    setClient(seededClient);
    void load(seededClient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function load(name = client) {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch(
        `/api/portal?client=${encodeURIComponent(name)}`,
      ).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      if (!res.view?.ok) throw new Error(res.view?.error || "not found");
      setView(res.view);
      setClient(res.view.client);
      if (res.view.clients) setClients(res.view.clients);
    } catch (e) {
      setView(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function action(body: object, successMsg?: string) {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => r.json());
      if (!res.ok) throw new Error(res.error);
      if (successMsg) setMsg(successMsg);
      await load(client);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const engId =
    view?.primary_engagement_id || view?.engagements?.[0]?.id || "";

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "proposal", label: "Proposal & money" },
    { id: "documents", label: "Documents" },
    { id: "timeline", label: "Timeline" },
    { id: "deployments", label: "Deployments" },
    { id: "meetings", label: "Meetings" },
    { id: "support", label: "Support" },
  ];

  return (
    <motion.div
      variants={containerVariant}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-12"
    >
      <PageHeader
        eyebrow="Client Portal"
        title="Project status & documents"
        description="Project status, documents, invoices, approvals, and support — transparent end to end."
        actions={
          <Link href="/business" className="btn btn-ghost text-sm">
            Business OS
          </Link>
        }
      />

      <motion.div variants={cardVariant}>
        <Section title="Open a client portal">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-50 flex-1">
            <label className="label">Client</label>
            {clients.length > 0 ? (
              <select
                className="select"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              >
                <option value="">Select client…</option>
                {clients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Client name"
              />
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !client.trim()}
            onClick={() => load()}
          >
            {busy ? "Loading…" : "Open portal"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-300">{error}</p>
        ) : null}
        {msg ? (
          <p className="mt-3 text-sm text-emerald-300">{msg}</p>
        ) : null}
        </Section>
      </motion.div>

      {!view ? (
        <motion.div variants={cardVariant} className="mt-4">
          <Empty>
            Select a client with an active engagement, or{" "}
            <Link href="/business" className="text-sky-300 hover:underline">
              create one in Business OS
            </Link>
            .
          </Empty>
        </motion.div>
      ) : (
        <>
          {/* Hero status */}
          <motion.div
            variants={cardVariant}
            className="mt-4 rounded-2xl border border-sky-500/20 bg-linear-to-br from-sky-500/10 via-transparent to-violet-500/10 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-(--muted)">
                  Project status
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {view.project_status?.label}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-(--muted)">
                  {view.trust_message}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold">
                  {view.progress_pct ?? 0}%
                </p>
                <p className="text-xs text-(--muted)">overall progress</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
              <div
                className="h-full rounded-full bg-linear-to-r from-sky-400 to-violet-500 transition-all"
                style={{ width: `${view.progress_pct || 0}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill
                status={
                  view.approvals?.client ? "proposal_accepted" : "awaiting_you"
                }
              />
              <StatusPill
                status={view.approvals?.deposit ? "deposit_paid" : "deposit_open"}
              />
              {view.approvals?.factory_ready ? (
                <StatusPill status="in_delivery" />
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/consult?client=${encodeURIComponent(view.client || client)}`} className="btn btn-ghost text-xs">
                Back to consultant view
              </Link>
              {engId ? (
                <Link
                  href={`/business?id=${encodeURIComponent(engId)}`}
                  className="btn btn-primary text-xs"
                >
                  Open factory workspace
                </Link>
              ) : null}
            </div>
          </motion.div>

          <motion.div variants={cardVariant} className="mt-4 grid-metrics">
            <Metric
              label="Proposal"
              value={
                view.proposals?.[0]?.total != null
                  ? `$${Number(view.proposals[0].total).toLocaleString()}`
                  : "—"
              }
              hint={view.proposals?.[0]?.status?.replaceAll("_", " ")}
            />
            <Metric
              label="Open tickets"
              value={(view.tickets || []).filter(
                (t: { status: string }) => t.status !== "closed",
              ).length}
            />
            <Metric
              label="Documents"
              value={(view.documents || []).length}
            />
            <Metric
              label="Deployments"
              value={(view.builds || []).length}
            />
          </motion.div>

          {/* Tabs */}
          <motion.div
            variants={cardVariant}
            className="mt-4 flex flex-wrap gap-2 border-b border-(--border) pb-3"
          >
            {tabs.map((t) => (
              <motion.button
                key={t.id}
                type="button"
                className={`btn text-xs ${tab === t.id ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setTab(t.id)}
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              >
                {t.label}
              </motion.button>
            ))}
          </motion.div>

          {tab === "overview" ? (
            <motion.div variants={containerVariant} className="mt-4 grid gap-4 lg:grid-cols-2">
              <Section title="Engagements">
                <ul className="space-y-2 text-sm">
                  {(view.engagements || []).map(
                    (e: {
                      id: string;
                      status: string;
                      stage: string;
                      industry: string;
                      commercial_total?: number;
                    }) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between rounded-lg border border-(--border) px-3 py-2"
                      >
                        <div>
                          <p>
                            {e.industry} · {e.stage?.replaceAll("_", " ")}
                          </p>
                          {e.commercial_total != null ? (
                            <p className="text-xs muted">
                              ${e.commercial_total.toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                        <StatusPill status={e.status} />
                      </li>
                    ),
                  )}
                </ul>
              </Section>

              <Section title="Approvals checklist">
                <ul className="space-y-2 text-sm">
                  {[
                    ["Internal review", view.approvals?.internal],
                    ["Your proposal approval", view.approvals?.client],
                    ["Deposit received", view.approvals?.deposit],
                    ["Delivery started", view.approvals?.factory_ready],
                  ].map(([label, ok]) => (
                    <li
                      key={String(label)}
                      className="flex justify-between rounded-lg border border-(--border) px-3 py-2"
                    >
                      <span>{label}</span>
                      <span className={ok ? "text-emerald-300" : "muted"}>
                        {ok ? "Complete" : "Pending"}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {view.can_approve && engId ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy}
                      onClick={() =>
                        action(
                          {
                            action: "approve",
                            engagement_id: engId,
                            actor: client,
                          },
                          "Proposal accepted — thank you",
                        )
                      }
                    >
                      Approve proposal
                    </button>
                  ) : null}
                  {view.can_confirm_deposit && engId ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy}
                      onClick={() =>
                        action(
                          {
                            action: "confirm_deposit",
                            engagement_id: engId,
                            actor: client,
                          },
                          "Deposit marked received",
                        )
                      }
                    >
                      Confirm deposit paid
                    </button>
                  ) : null}
                  {view.executive_briefing_url ? (
                    <a
                      className="btn btn-ghost"
                      href={view.executive_briefing_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Executive briefing
                    </a>
                  ) : null}
                </div>
              </Section>

              <Section title="Recent activity" className="lg:col-span-2">
                <ul className="space-y-2">
                  {(view.timeline || []).slice(0, 8).map(
                    (
                      ev: { at: string; kind: string; text: string },
                      i: number,
                    ) => (
                      <li
                        key={`${ev.at}-${i}`}
                        className="flex gap-3 border-b border-(--border) py-2 text-sm"
                      >
                        <span className="w-36 shrink-0 font-mono text-[10px] text-(--muted)">
                          {ev.at?.slice(0, 16)?.replace("T", " ")}
                        </span>
                        <span className="badge shrink-0">{ev.kind}</span>
                        <span>{ev.text}</span>
                      </li>
                    ),
                  )}
                </ul>
              </Section>
            </motion.div>
          ) : null}

          {tab === "proposal" ? (
            <motion.div variants={containerVariant} className="mt-4 grid gap-4 lg:grid-cols-2">
              <Section title="Proposal">
                {(view.proposals || []).length === 0 ? (
                  <p className="text-sm muted">
                    Proposal not ready yet — your consultant is still in discovery.
                  </p>
                ) : (
                  (view.proposals || []).map(
                    (p: {
                      id: string;
                      headline: string;
                      total: number;
                      deposit: number;
                      status: string;
                      weeks?: number;
                      payment_terms?: string;
                      blueprint?: string;
                    }) => (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold">{p.headline}</h3>
                          <StatusPill status={p.status} />
                        </div>
                        <p className="mt-3 text-3xl font-semibold">
                          ${Number(p.total || 0).toLocaleString()}
                        </p>
                        <p className="mt-2 text-sm text-(--muted)">
                          Deposit ${Number(p.deposit || 0).toLocaleString()} ·{" "}
                          {p.weeks || "—"} weeks
                          {p.blueprint ? ` · ${p.blueprint}` : ""}
                        </p>
                        <p className="mt-1 text-xs muted">{p.payment_terms}</p>
                        {view.can_approve ? (
                          <button
                            type="button"
                            className="btn btn-primary mt-4"
                            disabled={busy}
                            onClick={() =>
                              action(
                                {
                                  action: "approve",
                                  engagement_id: engId,
                                  actor: client,
                                },
                                "Proposal accepted",
                              )
                            }
                          >
                            Accept proposal
                          </button>
                        ) : null}
                      </div>
                    ),
                  )
                )}
              </Section>

              <Section title="Invoices">
                {(view.invoices || []).length === 0 ? (
                  <p className="text-sm muted">No invoices yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {(view.invoices || []).map(
                      (inv: {
                        id: string;
                        label: string;
                        amount: number;
                        status: string;
                        terms?: string;
                      }) => (
                        <li
                          key={inv.id}
                          className="flex items-center justify-between rounded-lg border border-(--border) px-3 py-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{inv.label}</p>
                            <p className="text-xs muted">{inv.terms}</p>
                          </div>
                          <div className="text-right">
                            <p>${Number(inv.amount || 0).toLocaleString()}</p>
                            <StatusPill status={inv.status} />
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </Section>

              <Section title="Contracts" className="lg:col-span-2">
                {(view.contracts || []).length === 0 ? (
                  <p className="text-sm muted">Contracts appear with the commercial pack.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(view.contracts || []).map(
                      (c: {
                        id: string;
                        type: string;
                        title: string;
                        status: string;
                      }) => (
                        <div
                          key={c.id}
                          className="rounded-lg border border-(--border) px-3 py-3 text-sm"
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-medium">{c.title}</span>
                            <StatusPill status={c.status} />
                          </div>
                          <p className="mt-1 text-xs muted">
                            {c.type} · {c.id}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Section>
            </motion.div>
          ) : null}

          {tab === "documents" ? (
            <motion.div variants={containerVariant} className="mt-4 grid gap-4 lg:grid-cols-2">
              {["business", "scope", "technical", "commercial"].map((cat) => (
                <Section key={cat} title={cat}>
                  <ul className="max-h-56 space-y-1 overflow-auto text-sm">
                    {((view.documents_by_category || {})[cat] || []).map(
                      (d: {
                        key: string;
                        title: string;
                        id: string;
                        preview?: string;
                      }) => (
                        <li
                          key={d.key}
                          className="rounded-lg border border-(--border) px-3 py-2"
                        >
                          <div className="flex justify-between gap-2">
                            <span>{d.title}</span>
                            <span className="font-mono text-[10px] muted">
                              {d.id}
                            </span>
                          </div>
                          {d.preview ? (
                            <p className="mt-1 text-xs muted line-clamp-2">
                              {d.preview}
                            </p>
                          ) : null}
                        </li>
                      ),
                    )}
                    {!((view.documents_by_category || {})[cat] || []).length ? (
                      <li className="muted text-xs">None in this category</li>
                    ) : null}
                  </ul>
                </Section>
              ))}
              <Section title="Share a file (meta)" className="lg:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    className="input max-w-md"
                    placeholder="filename.pdf"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy || !uploadName || !engId}
                    onClick={() => {
                      void action(
                        {
                          action: "upload",
                          engagement_id: engId,
                          file_name: uploadName,
                        },
                        "Upload recorded",
                      );
                      setUploadName("");
                    }}
                  >
                    Record upload
                  </button>
                </div>
                <ul className="mt-3 space-y-1 text-xs muted">
                  {(view.uploads || []).map(
                    (u: { name: string; at: string }, i: number) => (
                      <li key={`${u.name}-${i}`}>
                        {u.name} · {u.at?.slice(0, 10)}
                      </li>
                    ),
                  )}
                </ul>
              </Section>
            </motion.div>
          ) : null}

          {tab === "timeline" ? (
            <motion.div variants={containerVariant} className="mt-4 grid gap-4 lg:grid-cols-2">
              <Section title="Delivery milestones">
                <ul className="space-y-2">
                  {(view.milestones || []).map(
                    (m: {
                      name: string;
                      week: number;
                      state?: string;
                      index?: number;
                    }) => (
                      <li
                        key={`${m.week}-${m.name}`}
                        className="flex items-center justify-between rounded-lg border border-(--border) px-3 py-2 text-sm"
                      >
                        <span>
                          Week {m.week}: {m.name}
                        </span>
                        <StatusPill status={m.state || "upcoming"} />
                      </li>
                    ),
                  )}
                  {!view.milestones?.length ? (
                    <li className="muted text-sm">Timeline appears with proposal.</li>
                  ) : null}
                </ul>
              </Section>
              <Section title="Activity feed">
                <ul className="max-h-80 space-y-2 overflow-auto">
                  {(view.timeline || []).map(
                    (
                      ev: { at: string; kind: string; text: string },
                      i: number,
                    ) => (
                      <li key={`${i}-${ev.at}`} className="text-sm">
                        <span className="font-mono text-[10px] muted">
                          {ev.at?.slice(0, 16)?.replace("T", " ")}
                        </span>
                        <p>
                          <span className="badge mr-2">{ev.kind}</span>
                          {ev.text}
                        </p>
                      </li>
                    ),
                  )}
                </ul>
              </Section>
            </motion.div>
          ) : null}

          {tab === "deployments" ? (
            <motion.div variants={cardVariant} className="mt-4">
              <Section title="Environments & monitoring">
                {(view.builds || []).length === 0 ? (
                  <Empty>
                    No deployments yet. After deposit, delivery status appears
                    here.
                  </Empty>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {(view.builds || []).map(
                      (b: {
                        id: string;
                        status: string;
                        url?: string;
                        environment?: string;
                        monitoring?: {
                          healthy?: boolean;
                          last_check?: string;
                          uptime_target?: string;
                        };
                        maintenance?: { active?: boolean; renewal_date?: string };
                      }) => (
                        <div
                          key={b.id}
                          className="rounded-xl border border-(--border) p-4 text-sm"
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-medium">
                              {b.environment || "production"}
                            </span>
                            <StatusPill status={b.status} />
                          </div>
                          {b.url ? (
                            <a
                              href={b.url}
                              className="mt-2 block text-sky-300 hover:underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {b.url}
                            </a>
                          ) : (
                            <p className="mt-2 muted">URL pending</p>
                          )}
                          <p className="mt-2 text-xs muted">
                            Health:{" "}
                            {b.monitoring?.healthy ? "healthy" : "checking"} ·
                            target {b.monitoring?.uptime_target || "—"}
                          </p>
                          {b.maintenance?.active ? (
                            <p className="mt-1 text-xs text-emerald-300">
                              Maintenance active · renewal{" "}
                              {b.maintenance.renewal_date}
                            </p>
                          ) : null}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Section>
            </motion.div>
          ) : null}

          {tab === "meetings" ? (
            <motion.div variants={containerVariant} className="mt-4 grid gap-4 lg:grid-cols-2">
              <Section title="Scheduled / available">
                <ul className="space-y-2 text-sm">
                  {(view.meetings || []).map(
                    (m: {
                      id: string;
                      title: string;
                      status: string;
                      when: string;
                    }) => (
                      <li
                        key={m.id}
                        className="flex justify-between rounded-lg border border-(--border) px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{m.title}</p>
                          <p className="text-xs muted">{m.when}</p>
                        </div>
                        <StatusPill status={m.status} />
                      </li>
                    ),
                  )}
                </ul>
              </Section>
              <Section title="Request a meeting">
                <input
                  className="input mb-2"
                  placeholder="Preferred time"
                  value={meetingWhen}
                  onChange={(e) => setMeetingWhen(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy || !engId || !meetingWhen}
                  onClick={() => {
                    void action(
                      {
                        action: "meeting",
                        engagement_id: engId,
                        title: "Client-requested meeting",
                        when: meetingWhen,
                      },
                      "Meeting requested",
                    );
                    setMeetingWhen("");
                  }}
                >
                  Request meeting
                </button>
              </Section>
            </motion.div>
          ) : null}

          {tab === "support" ? (
            <motion.div variants={containerVariant} className="mt-4 grid gap-4 lg:grid-cols-2">
              <Section title="New support ticket">
                <div className="space-y-2">
                  <input
                    className="input"
                    placeholder="Subject"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                  <textarea
                    className="textarea"
                    placeholder="How can we help?"
                    value={ticketBody}
                    onChange={(e) => setTicketBody(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy || !ticketSubject}
                    onClick={() => {
                      void action(
                        {
                          action: "ticket",
                          client,
                          subject: ticketSubject,
                          body: ticketBody,
                        },
                        "Ticket submitted",
                      );
                      setTicketSubject("");
                      setTicketBody("");
                    }}
                  >
                    Submit ticket
                  </button>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {(view.tickets || []).map(
                    (t: { id: string; subject: string; status: string }) => (
                      <li
                        key={t.id}
                        className="flex justify-between rounded-lg border border-(--border) px-3 py-2"
                      >
                        <span>{t.subject}</span>
                        <StatusPill status={t.status} />
                      </li>
                    ),
                  )}
                </ul>
              </Section>

              <Section title="Comments for your consultant">
                <textarea
                  className="textarea mb-2"
                  placeholder="Question or note on the proposal…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy || !comment || !engId}
                  onClick={() => {
                    void action(
                      {
                        action: "comment",
                        engagement_id: engId,
                        author: client,
                        text: comment,
                      },
                      "Comment sent",
                    );
                    setComment("");
                  }}
                >
                  Send comment
                </button>
                <ul className="mt-4 max-h-48 space-y-2 overflow-auto text-sm">
                  {(view.comments || []).map(
                    (
                      c: { author: string; text: string; at: string },
                      i: number,
                    ) => (
                      <li
                        key={`${c.at}-${i}`}
                        className="rounded-lg border border-(--border) px-3 py-2"
                      >
                        <p className="text-xs muted">
                          {c.author} · {c.at?.slice(0, 16)?.replace("T", " ")}
                        </p>
                        <p>{c.text}</p>
                      </li>
                    ),
                  )}
                </ul>
              </Section>
            </motion.div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
