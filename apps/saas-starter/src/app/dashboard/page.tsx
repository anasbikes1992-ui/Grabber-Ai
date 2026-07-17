import { getSessionUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  return (
    <div data-testid="dashboard">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Welcome back{user ? `, ${user.email}` : ""}. This is the Sprint 1
        dashboard shell for the SaaS Starter product.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Tenants",
            body: "Multi-tenant isolation (module stub — Sprint 1).",
          },
          {
            title: "Team",
            body: "RBAC roles: owner, admin, member (DNA).",
          },
          {
            title: "Billing",
            body: "Stripe-ready account model (stub until connector deepen).",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="font-medium">{card.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
