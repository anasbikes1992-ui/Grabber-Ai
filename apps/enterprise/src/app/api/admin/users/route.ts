import { getSupabaseAdminClient } from "@/lib/production/supabase";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AppMeta = { role?: string; engagement_id?: string };

async function requireAdmin() {
  const user = await getSessionUser();
  return user?.role === "admin" ? user : null;
}

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

/** List registered accounts (admin only). */
export async function GET() {
  if (!(await requireAdmin())) return json({ ok: false, error: "forbidden" }, 403);

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;

    const users = (data.users ?? []).map((u) => {
      const meta = (u.app_metadata ?? {}) as AppMeta;
      return {
        id: u.id,
        email: u.email ?? null,
        phone: u.phone ?? null,
        role: meta.role ?? "client",
        engagement_id: meta.engagement_id ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        confirmed: Boolean(u.email_confirmed_at),
      };
    });
    users.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return json({ ok: true, users, total: users.length });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
}

/** Assign a role and/or engagement to an account (admin provisioning). */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return json({ ok: false, error: "forbidden" }, 403);

  try {
    const body = (await req.json().catch(() => ({}))) as {
      userId?: string;
      role?: string;
      engagementId?: string;
    };
    if (!body.userId) return json({ ok: false, error: "userId required" }, 400);

    const supabase = getSupabaseAdminClient();
    const { data: current, error: getErr } = await supabase.auth.admin.getUserById(body.userId);
    if (getErr) throw getErr;

    const meta = { ...((current.user?.app_metadata ?? {}) as AppMeta) };
    if (body.role) meta.role = body.role;
    if (body.engagementId !== undefined) meta.engagement_id = body.engagementId || undefined;

    const { error } = await supabase.auth.admin.updateUserById(body.userId, {
      app_metadata: meta,
    });
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
}
