"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicEnv } from "@/lib/env";
import { DEMO_COOKIE } from "@/lib/auth/session";

export type AuthState = { error?: string; ok?: boolean };

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const env = getPublicEnv();

  if (env.demoMode) {
    const jar = await cookies();
    const payload = encodeURIComponent(
      JSON.stringify({ id: `demo_${email}`, email }),
    );
    jar.set(DEMO_COOKIE, payload, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/dashboard");
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    redirect("/dashboard");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // Next redirect
    return { error: "Sign-in failed. Check Supabase configuration." };
  }
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const env = getPublicEnv();

  if (env.demoMode) {
    const jar = await cookies();
    const payload = encodeURIComponent(
      JSON.stringify({ id: `demo_${email}`, email }),
    );
    jar.set(DEMO_COOKIE, payload, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/dashboard");
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    redirect("/dashboard");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: "Sign-up failed. Check Supabase configuration." };
  }
}

export async function signOut(): Promise<void> {
  const env = getPublicEnv();
  const jar = await cookies();
  jar.delete(DEMO_COOKIE);

  if (!env.demoMode) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  redirect("/login");
}
