import { assembleModules, listRegisteredModules, loadRegistry } from "@/modules";

export const dynamic = "force-dynamic";

export default function ModulesPage() {
  const registry = loadRegistry(process.cwd());
  const names = listRegisteredModules(process.cwd());

  // Demo assembly: SaaS baseline
  const saas = assembleModules(
    ["authentication", "teams", "billing", "notifications", "analytics"],
    { productType: "saas", cwd: process.cwd() },
  );
  // Booking proving ground
  const booking = assembleModules(
    [
      "authentication",
      "teams",
      "calendar",
      "booking",
      "payments",
      "notifications",
      "reviews",
      "search",
      "files",
      "analytics",
    ],
    { productType: "booking", cwd: process.cwd() },
  );

  return (
    <div data-testid="modules-page">
      <h1 className="text-2xl font-semibold tracking-tight">
        Business Module Catalog
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Sprint 5 — Product Factory assembles versioned business capabilities
        from the Factory Registry. DNA selects modules; the factory does not
        invent CRUD.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase text-zinc-500">SaaS assembly</p>
          <p className="mt-1 text-lg font-semibold">
            Reuse {(saas.module_reuse_rate * 100).toFixed(0)}%
          </p>
          <p className="mt-1 font-mono text-xs">
            {saas.resolved.join(" → ")}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase text-zinc-500">Booking assembly</p>
          <p className="mt-1 text-lg font-semibold">
            Reuse {(booking.module_reuse_rate * 100).toFixed(0)}%
          </p>
          <p className="mt-1 font-mono text-xs">
            {booking.resolved.join(" → ")}
          </p>
        </div>
      </div>

      <div className="mt-10 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Module</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Requires</th>
              <th className="px-3 py-2">Supports</th>
            </tr>
          </thead>
          <tbody>
            {names.map((n) => {
              const e = registry.modules[n];
              return (
                <tr
                  key={n}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 font-medium">
                    {e.title}{" "}
                    <span className="font-mono text-xs text-zinc-500">
                      {n}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{e.version}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {e.requires.join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {e.supports.join(", ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
