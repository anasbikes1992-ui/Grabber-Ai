import { GlassCard } from "@/components/ui/glass-card";
import { DnaGraph } from "@/components/views/dna-graph";

export default function DnaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">DNA Explorer</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Visual dependency graph for Project DNA module selection. Booking
          golden reference shown.
        </p>
      </div>
      <GlassCard className="!p-3">
        <DnaGraph product="Booking" />
      </GlassCard>
      <GlassCard>
        <p className="text-sm text-zinc-400">
          DNA is the specification. Factory Registry resolves dependencies
          (e.g. booking → calendar → authentication). Core never invents
          modules outside DNA + registry.
        </p>
      </GlassCard>
    </div>
  );
}
