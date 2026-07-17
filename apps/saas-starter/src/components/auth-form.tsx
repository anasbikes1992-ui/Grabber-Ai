"use client";

import { useActionState } from "react";
import type { AuthState } from "@/app/actions/auth";

type Props = {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
};

export function AuthForm({
  action,
  submitLabel,
  title,
  subtitle,
  footer,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>

      <form action={formAction} className="mt-8 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            data-testid="email"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="you@company.com"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            data-testid="password"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="••••••••"
          />
        </label>

        {state?.error ? (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
            role="alert"
            data-testid="auth-error"
          >
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          data-testid="auth-submit"
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "Working…" : submitLabel}
        </button>
      </form>

      {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
    </div>
  );
}
