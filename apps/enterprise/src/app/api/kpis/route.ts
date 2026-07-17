import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await ent();
    return jsonOk({ kpis: api.getBusinessKpis(monorepoCwd()) });
  } catch (e) {
    return jsonErr(e, 500);
  }
}
