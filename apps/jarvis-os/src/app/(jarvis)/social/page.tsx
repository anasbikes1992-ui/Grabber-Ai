import { GlassCard } from "@/components/ui/glass-card";

const PIPE = [
  "Research",
  "Ideas",
  "Content",
  "Images",
  "Approval",
  "Scheduling",
  "Publishing",
  "Analytics",
];

export default function SocialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Social command center
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Growth pipeline scaffold — Track B product surface, not Core.
        </p>
      </div>
      <GlassCard>
        <div className="flex flex-wrap gap-2">
          {PIPE.map((p) => (
            <span
              key={p}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300"
            >
              {p}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Platforms: Instagram · Facebook · TikTok · LinkedIn · X · YouTube ·
          Pinterest · Threads
        </p>
      </GlassCard>
    </div>
  );
}
