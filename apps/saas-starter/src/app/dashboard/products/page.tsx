import Link from "next/link";
import { listProducts } from "@/products";
import { buildAnalyticsDashboard } from "@/metrics/analytics";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  const products = listProducts(process.cwd());
  const analytics = buildAnalyticsDashboard(process.cwd());

  return (
    <div data-testid="products-page">
      <h1 className="text-2xl font-semibold tracking-tight">Product catalog</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Commercial factory surface: create, build, regenerate, deploy, archive.
        Grabber Core stays frozen — products assemble from blueprints and
        modules.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Products", analytics.products.total],
          ["Builds", analytics.builds.total],
          [
            "Avg reuse",
            `${(analytics.builds.avg_module_reuse_rate * 100).toFixed(0)}%`,
          ],
          [
            "Validation",
            `${(analytics.builds.validation_pass_rate * 100).toFixed(0)}%`,
          ],
        ].map(([k, v]) => (
          <div
            key={String(k)}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs uppercase text-zinc-500">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Blueprint</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reuse</th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-zinc-500">
                  No products yet. Use{" "}
                  <code className="text-xs">POST /api/products</code> or{" "}
                  <code className="text-xs">grabber create</code>.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.blueprint}</td>
                  <td className="px-3 py-2">{p.status}</td>
                  <td className="px-3 py-2">
                    {p.last_build
                      ? `${(p.last_build.module_reuse_rate * 100).toFixed(0)}%`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {p.last_build?.production_url ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">
                    {p.updated_at.slice(0, 19)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm">
        <Link href="/dashboard/metrics" className="underline">
          Factory metrics & trends
        </Link>
        {" · "}
        <Link href="/dashboard/blueprints" className="underline">
          Blueprints
        </Link>
      </p>
    </div>
  );
}
