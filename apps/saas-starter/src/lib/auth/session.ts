import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";

export type SessionUser = {
  id: string;
  email: string;
  mode: "supabase" | "demo";
};

const DEMO_COOKIE = "grabber_demo_session";

export async function getSessionUser(): Promise<SessionUser | null> {
  const env = getPublicEnv();

  if (env.demoMode) {
    const jar = await cookies();
    const raw = jar.get(DEMO_COOKIE)?.value;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw)) as {
        id: string;
        email: string;
      };
      return { ...parsed, mode: "demo" };
    } catch {
      return null;
    }
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      mode: "supabase",
    };
  } catch {
    return null;
  }
}

export { DEMO_COOKIE };
