import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const api = await ent();
    const engagement = api.runBusinessAnalysis(
      id,
      body.answers || body || {},
      monorepoCwd(),
    );
    return jsonOk({ engagement });
  } catch (e) {
    return jsonErr(e);
  }
}
