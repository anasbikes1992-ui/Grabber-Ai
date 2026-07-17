"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

export type AuthState = { error?: string };

function isRedirectError(e: unknown): boolean {
  return Boolean(e && typeof e === "object" && "digest" in e);
}

/**
 * Password sign-in via Supabase. No demo / any-password path.
 * Owner lands on the console; clients land on their portal.
 */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  if (!isSupabaseConfigured()) {
    return { error: "Authentication is not configured. Set Supabase env vars." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: "Sign-in failed. Check Supabase configuration." };
  }

  const user = await getSessionUser();
  if (user?.role === "client") redirect("/portal");
  redirect("/");
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — cookie clears on next refresh
    }
  }
  redirect("/login");
}
