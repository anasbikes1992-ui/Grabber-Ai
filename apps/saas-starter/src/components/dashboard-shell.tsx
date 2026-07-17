import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth/session";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/intake", label: "Intake" },
  { href: "/dashboard/blueprints", label: "Blueprints" },
  { href: "/dashboard/modules", label: "Modules" },
  { href: "/dashboard/metrics", label: "Analytics" },
  { href: "/dashboard/intelligence", label: "Intelligence" },
  { href: "/dashboard/tenants", label: "Tenants" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function DashboardShell({
  user,
  appName,
  children,
}: {
  user: SessionUser;
  appName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl">
        <aside className="hidden w-56 shrink-0 border-r border-zinc-200 p-4 md:block dark:border-zinc-800">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Grabber
            </p>
            <p className="mt-1 text-sm font-semibold">{appName}</p>
          </div>
          <nav className="space-y-1" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 md:hidden">
              {appName}
            </p>
            <div className="ml-auto flex items-center gap-3">
              <span
                className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                data-testid="auth-mode"
              >
                {user.mode === "demo" ? "Demo auth" : "Supabase"}
              </span>
              <span className="text-sm" data-testid="user-email">
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  data-testid="sign-out"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Sign out
                </button>
              </form>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
