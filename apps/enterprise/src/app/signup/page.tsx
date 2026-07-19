"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: "2rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="badge">Grabber Enterprise</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "0.75rem" }}>
            Create client account
          </h1>
          <p className="muted" style={{ marginTop: "0.25rem", fontSize: "0.875rem" }}>
            Start with Jarvis consulting, then track progress in your portal.
          </p>
        </div>

        <form action={formAction} style={{ display: "grid", gap: "0.875rem" }}>
          <div style={{ display: "grid", gap: "0.375rem" }}>
            <label className="label" htmlFor="full_name">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              className="input"
              placeholder="Jane Silva"
            />
          </div>

          <div style={{ display: "grid", gap: "0.375rem" }}>
            <label className="label" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="input"
              placeholder="+94 77 123 4567"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={6}
              className="input"
              placeholder="At least 6 characters"
            />
          </div>

          {state.error ? (
            <p role="alert" style={{ color: "var(--danger)", fontSize: "0.8125rem", margin: 0 }}>
              {state.error}
            </p>
          ) : null}

          {state.success ? (
            <p style={{ color: "var(--success)", fontSize: "0.8125rem", margin: 0 }}>
              {state.success}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <div style={{ marginTop: "1rem" }}>
          <Link href="/login" className="btn btn-ghost" style={{ width: "100%" }}>
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}