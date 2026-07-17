import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await ent();
    return jsonOk({
      campaigns: api.listCampaigns(monorepoCwd()),
      stages: api.MARKETING_STAGES,
    });
  } catch (e) {
    return jsonErr(e, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const api = await ent();
    const cwd = monorepoCwd();
    const id = body.id;

    switch (body.action) {
      case "create":
        return jsonOk(
          { campaign: api.createCampaign(body, cwd) },
          201,
        );
      case "trends":
        return jsonOk({ campaign: api.runTrendDiscovery(id, cwd) });
      case "competitors":
        return jsonOk({ campaign: api.runCompetitorScan(id, cwd) });
      case "keywords":
        return jsonOk({ campaign: api.runKeywordResearch(id, cwd) });
      case "plan":
        return jsonOk({ campaign: api.planContent(id, cwd) });
      case "create_content":
        return jsonOk({ campaign: api.createContent(id, cwd) });
      case "approve":
        return jsonOk({
          campaign: api.approveContent(
            id,
            body.item_id,
            body.actor || "marketer",
            cwd,
          ),
        });
      case "publish":
        return jsonOk({ campaign: api.publishApproved(id, cwd) });
      case "run_pipeline": {
        let c = api.createCampaign(body, cwd);
        c = api.runTrendDiscovery(c.id, cwd);
        c = api.runCompetitorScan(c.id, cwd);
        c = api.runKeywordResearch(c.id, cwd);
        c = api.planContent(c.id, cwd);
        c = api.createContent(c.id, cwd);
        for (const item of c.content_items) {
          c = api.approveContent(c.id, item.id, "marketer", cwd);
        }
        c = api.publishApproved(c.id, cwd);
        return jsonOk({ campaign: c }, 201);
      }
      default:
        return jsonErr("unknown action");
    }
  } catch (e) {
    return jsonErr(e);
  }
}
