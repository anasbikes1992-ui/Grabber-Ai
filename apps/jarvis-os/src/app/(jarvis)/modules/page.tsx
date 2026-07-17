import { GlassCard } from "@/components/ui/glass-card";
import { loadJarvisFactoryData } from "@/lib/factory-client";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const status = await loadJarvisFactoryData();
  const modules = status.catalog?.modules ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Module Registry</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Versioned business capabilities. Portable across every generated
          product.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Quality</th>
              <th className="px-4 py-3">Requires</th>
              <th className="px-4 py-3">Supports</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr
                key={m.name}
                className="border-t border-white/5 text-zinc-300"
              >
                <td className="px-4 py-2.5 font-medium text-white">
                  {m.title}{" "}
                  <span className="font-mono text-xs text-zinc-500">
                    {m.name}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{m.version}</td>
                <td className="px-4 py-2.5 text-cyan-300/90">
                  {m.quality_score}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                  {m.requires.join(", ") || "—"}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">
                  {m.supports.join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!status.online ? (
        <GlassCard>
          <p className="text-sm text-zinc-400">
            Showing demo catalog subset. Connect factory host for full 18
            modules.
          </p>
        </GlassCard>
      ) : null}
    </div>
  );
}
