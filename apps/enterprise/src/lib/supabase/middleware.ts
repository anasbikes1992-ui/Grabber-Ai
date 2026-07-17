import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refreshes the Supabase auth session on page navigations and forwards the
 * rotated cookies. Does NOT gate — route-group layouts enforce access.
 * No-op when Supabase is not configured.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (!url || !anonKey) return response;

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Refresh the session opportunistically. Page-level layouts still own the
    // actual access decision, so middleware should not 500 if token refresh
    // fails in Edge/runtime environments.
    await supabase.auth.getUser();
  } catch (error) {
    console.warn(
      JSON.stringify({
        scope: "middleware",
        event: "supabase_session_refresh_failed",
        pathname: request.nextUrl.pathname,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return NextResponse.next({ request });
  }

  return response;
}
