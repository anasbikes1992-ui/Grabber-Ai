import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const api = await ent();
    const cwd = monorepoCwd();
    const url = new URL(req.url);
    const industry = url.searchParams.get("industry");
    if (industry) {
      return jsonOk({ playbook: api.loadPlaybook(industry, cwd) });
    }
    return jsonOk({ industries: api.listIndustries(cwd) });
  } catch (e) {
    return jsonErr(e, 500);
  }
}
