import { GlassCard } from "@/components/ui/glass-card";

export default function DeploymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Deployments</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Deployment center timeline — GitHub → Supabase → Stripe → Vercel →
          Production.
        </p>
      </div>
      <GlassCard>
        <ol className="relative space-y-4 border-l border-cyan-500/30 pl-6">
          {[
            "Repository provisioned",
            "Migrations planned",
            "Billing webhooks registered",
            "Vercel project linked",
            "Production URL returned",
          ].map((step) => (
            <li key={step} className="text-sm text-zinc-300">
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
              {step}
            </li>
          ))}
        </ol>
      </GlassCard>
    </div>
  );
}
