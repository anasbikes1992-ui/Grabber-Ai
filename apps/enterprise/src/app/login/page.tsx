"use client";

import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380, padding: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="badge">Grabber Enterprise</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "0.75rem" }}>
            Sign in
          </h1>
          <p className="muted" style={{ marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Owner console and client portal access.
          </p>
        </div>

        <form action={formAction} style={{ display: "grid", gap: "0.875rem" }}>
          <div style={{ display: "grid", gap: "0.375rem" }}>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              placeholder="you@company.com"
            />
          </div>

          <div style={{ display: "grid", gap: "0.375rem" }}>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              className="input"
              placeholder="••••••••"
            />
          </div>

          {state.error ? (
            <p
              role="alert"
              style={{ color: "var(--danger)", fontSize: "0.8125rem", margin: 0 }}
            >
              {state.error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
