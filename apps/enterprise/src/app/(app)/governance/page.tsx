"use client";

import { PageHeader, Section } from "@/components/ui";
import Link from "next/link";

const STAGES = [
  "Client",
  "Discovery",
  "Business Analysis",
  "Solution Design",
  "Commercial Review",
  "Risk Review",
  "Legal Review",
  "Internal Approval",
  "Client Approval",
  "Deposit Received",
  "Factory Build",
];

export default function GovernancePage() {
  return (
    <div>
      <PageHeader
        title="Delivery Governance"
        description="Hard gate before Product Factory. Prevents scope creep and protects margin. Milestone 4 hands approved DNA only to the existing factory."
      />

      <Section title="Mandatory path">
        <ol className="space-y-2">
          {STAGES.map((s, i) => (
            <li
              key={s}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/15 text-xs text-sky-300">
                {i + 1}
              </span>
              {s}
              {s === "Factory Build" ? (
                <span className="ml-auto text-xs text-emerald-300">
                  Core Product Factory only
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section title="Factory integration rules">
          <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>No second orchestrator — use Grabber Core factory only</li>
            <li>DNA must include engagement_id in governance metadata</li>
            <li>Internal approval + client approval + deposit required</li>
            <li>Commercial package must exist (proposal + SOW)</li>
            <li>
              Handoff API:{" "}
              <code className="text-sky-300">
                GET /api/engagements/:id/handoff
              </code>
            </li>
            <li>
              CLI:{" "}
              <code className="text-sky-300">
                grabber enterprise handoff &lt;id&gt;
              </code>
            </li>
          </ul>
        </Section>
        <Section title="Operate">
          <div className="flex flex-col gap-2">
            <Link href="/business" className="btn btn-primary">
              Run engagement workflow
            </Link>
            <Link href="/" className="btn btn-ghost">
              Seed full demo path
            </Link>
          </div>
          <p className="mt-4 text-sm muted">
            Factory Excellence (Program B) continues in saas-starter modules,
            blueprints, and golden references — not redesigned here.
          </p>
        </Section>
      </div>
    </div>
  );
}
