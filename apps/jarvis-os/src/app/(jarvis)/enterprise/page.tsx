import { GlassCard, MetricTile } from "@/components/ui/glass-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ENTERPRISE_URL =
  process.env.NEXT_PUBLIC_ENTERPRISE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3002";

const SURFACES = [
  {
    title: "Business OS",
    href: `${ENTERPRISE_URL}/business`,
    blurb: "Discovery, playbooks, analysis, solution DNA",
  },
  {
    title: "Client Portal",
    href: `${ENTERPRISE_URL}/portal`,
    blurb: "Proposals, documents, approvals, tickets",
  },
  {
    title: "Operations",
    href: `${ENTERPRISE_URL}/ops`,
    blurb: "Pipeline, capacity, revenue, tickets",
  },
  {
    title: "Delivery & Support",
    href: `${ENTERPRISE_URL}/delivery`,
    blurb: "Deploy tracking, monitoring, renewals",
  },
  {
    title: "Marketing Intelligence",
    href: `${ENTERPRISE_URL}/marketing`,
    blurb: "Trends → content → publish → analytics",
  },
  {
    title: "Business KPIs",
    href: `${ENTERPRISE_URL}/kpis`,
    blurb: "Whole-company conversion & margin",
  },
];

/**
 * Milestone 7 — Jarvis Experience presents Enterprise programs.
 * Business logic lives in apps/enterprise + @grabber/enterprise.
 */
export default function EnterpriseExperiencePage() {
  return (
    <div className="space-y-6" data-testid="jarvis-enterprise">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Enterprise Experience
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Jarvis is the premium shell over Business OS through Marketing
          Intelligence. Grabber Core stays frozen; Product Factory remains the
          only manufacturing path after Delivery Governance.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Milestones" value="7/7" hint="Enterprise v3.0" />
        <MetricTile
          label="Programs"
          value="A–F"
          hint="Business → Jarvis"
          accent="violet"
        />
        <MetricTile
          label="Core"
          value="Frozen"
          hint="Track A · v1.8.x"
          accent="blue"
        />
        <MetricTile
          label="Factory gate"
          value="On"
          hint="Deposit + dual approval"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SURFACES.map((s) => (
          <GlassCard key={s.title}>
            <h2 className="text-sm font-semibold text-white">{s.title}</h2>
            <p className="mt-1 text-xs text-zinc-400">{s.blurb}</p>
            <a
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-xs text-cyan-300 hover:underline"
            >
              Open surface →
            </a>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h2 className="text-sm font-semibold text-white">
          Delivery Governance → Factory
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Approved DNA only. CLI:{" "}
          <code className="text-cyan-300">
            grabber enterprise seed · handoff · from-engagement
          </code>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={ENTERPRISE_URL}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
            target="_blank"
            rel="noreferrer"
          >
            Enterprise Command Center
          </a>
          <Link
            href="/factory"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
          >
            Product Factory view
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
          >
            Command center
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
