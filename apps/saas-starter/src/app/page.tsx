import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  const env = getPublicEnv();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 px-4 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Grabber AI Studio · Track B
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {env.appName}
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Sprint 1 foundation: Next.js, TypeScript, Tailwind, Supabase-ready
          auth, and a dashboard shell. Built as a product on Grabber Core — not
          a second platform.
        </p>
        {env.demoMode ? (
          <p
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
            data-testid="demo-banner"
          >
            Demo mode: set{" "}
            <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="font-mono text-xs">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            in <code className="font-mono text-xs">.env.local</code> for live
            Supabase.
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            data-testid="go-login"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-white dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
