import { GlassCard } from "@/components/ui/glass-card";

const PROJECTS = [
  { name: "booking-reference", type: "booking", status: "golden" },
  { name: "saas-reference", type: "saas", status: "golden" },
  { name: "crm-reference", type: "crm", status: "golden" },
  { name: "marketplace-reference", type: "marketplace", status: "golden" },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Projects</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Commercial and golden reference products assembled by the factory.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {PROJECTS.map((p, i) => (
          <GlassCard key={p.name} delay={i * 0.05}>
            <p className="font-medium text-white">{p.name}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">
              type={p.type} · {p.status}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
