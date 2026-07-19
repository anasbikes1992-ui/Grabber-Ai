"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

export type AuthState = { error?: string; success?: string };

function isRedirectError(e: unknown): boolean {
  return Boolean(e && typeof e === "object" && "digest" in e);
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
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
    return { error: `Sign-in failed: ${errorMessage(e)}` };
  }

  const user = await getSessionUser();
  if (user?.role === "client") redirect("/portal");
  redirect("/command-center");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  if (!isSupabaseConfigured()) {
    return { error: "Authentication is not configured. Set Supabase env vars." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Self-reported contact info only — never used for role/authorization
        // decisions (role stays in app_metadata, set by the owner).
        data: {
          role: "client",
          full_name: fullName || undefined,
          phone: phone || undefined,
        },
      },
    });

    if (error) return { error: error.message };

    if (data.session) {
      redirect("/portal");
    }

    return { success: "Account created. Check your email, then sign in." };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return { error: `Sign-up failed: ${errorMessage(e)}` };
  }
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
  redirect("/consult");
}
