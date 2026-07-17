import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const api = await ent();
    const cwd = monorepoCwd();
    const url = new URL(req.url);
    const client = url.searchParams.get("client") || "";
    if (!client) {
      return jsonOk({ clients: api.listPortalClients(cwd) });
    }
    const view = api.getClientPortalView(client, cwd);
    return jsonOk({ view });
  } catch (e) {
    return jsonErr(e, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const api = await ent();
    const cwd = monorepoCwd();

    if (body.action === "approve") {
      const engagement = api.clientApprove(
        body.engagement_id,
        body.actor || "client",
        cwd,
      );
      return jsonOk({ engagement });
    }
    if (body.action === "confirm_deposit") {
      const engagement = api.clientConfirmDeposit(
        body.engagement_id,
        body.actor || "client",
        cwd,
      );
      return jsonOk({ engagement });
    }
    if (body.action === "ticket") {
      const ticket = api.clientCreateTicket(
        body.client,
        body.subject || "Support",
        body.body || "",
        cwd,
      );
      return jsonOk({ ticket });
    }
    if (body.action === "comment") {
      const engagement = api.clientComment(
        body.engagement_id,
        body.author || "client",
        body.text || "",
        cwd,
      );
      return jsonOk({ engagement });
    }
    if (body.action === "upload") {
      const engagement = api.clientUploadMeta(
        body.engagement_id,
        body.file_name || "upload.bin",
        cwd,
      );
      return jsonOk({ engagement });
    }
    if (body.action === "meeting") {
      const engagement = api.clientScheduleMeeting(
        body.engagement_id,
        {
          title: body.title,
          when: body.when,
          notes: body.notes,
        },
        cwd,
      );
      return jsonOk({ engagement });
    }
    return jsonErr("unknown action");
  } catch (e) {
    return jsonErr(e);
  }
}
