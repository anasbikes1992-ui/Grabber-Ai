import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Session identity for the browser: role + linked engagement (clients). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return Response.json({
    ok: true,
    user: {
      email: user.email,
      role: user.role,
      engagementId: user.engagementId,
    },
  });
}
