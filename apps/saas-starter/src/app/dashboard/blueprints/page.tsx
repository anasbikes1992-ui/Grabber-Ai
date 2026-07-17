import {
  listBlueprints,
  loadBlueprint,
  goldenBlueprints,
  materializeBlueprint,
} from "@/blueprints";

export const dynamic = "force-dynamic";

export default function BlueprintsPage() {
  const cwd = process.cwd();
  const ids = listBlueprints(cwd);
  const golden = new Set(goldenBlueprints(cwd));
  const booking = materializeBlueprint("booking", {}, { cwd });

  return (
    <div data-testid="blueprints-page">
      <h1 className="text-2xl font-semibold tracking-tight">
        Product blueprints
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Sprint 6 — reusable product recipes. Modules stay independent;
        blueprints select and constrain them. Booking is a golden reference
        product for the factory regression suite.
      </p>

      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950">
        <p className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-200">
          Reference Product: Booking
        </p>
        <p className="mt-2 text-lg font-semibold">
          Module reuse{" "}
          {booking.assembly
            ? `${(booking.assembly.module_reuse_rate * 100).toFixed(0)}%`
            : "—"}
        </p>
        <p className="mt-1 font-mono text-xs">
          {booking.modules.join(" → ")}
        </p>
        <p className="mt-2 text-sm">
          Integrations: {booking.integrations.join(", ")}
        </p>
      </div>

      <div className="mt-10 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Blueprint</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2">Required modules</th>
              <th className="px-3 py-2">Min reuse</th>
              <th className="px-3 py-2">Golden</th>
            </tr>
          </thead>
          <tbody>
            {ids.map((id) => {
              const b = loadBlueprint(id, cwd);
              return (
                <tr
                  key={id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 font-medium">
                    {b.title}{" "}
                    <span className="font-mono text-xs text-zinc-500">
                      {id}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{b.version}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {b.modules.required.join(", ")}
                  </td>
                  <td className="px-3 py-2">
                    {(b.quality.min_module_reuse_rate * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2">
                    {golden.has(id) ? "yes" : "—"}
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
