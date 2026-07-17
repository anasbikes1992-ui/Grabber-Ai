import { ent, monorepoCwd, jsonOk, jsonErr } from "@/lib/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Jarvis consulting API — business story in, blueprint out (not code).
 * LLM path when ANTHROPIC_API_KEY set; deterministic fallback otherwise.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const api = await ent();
    const cwd = monorepoCwd();
    const action = body.action || "start";

    if (action === "start") {
      const engagement = api.startConsultation(
        {
          story: body.story || body.business_story,
          name: body.name,
          industry: body.industry,
          contact_email: body.email,
        },
        cwd,
      );
      return jsonOk(
        {
          engagement,
          status: api.getConsultingStatus(engagement.id, cwd),
        },
        201,
      );
    }

    if (action === "answer") {
      const result = await api.answerDiscovery(body.id, body.answers || {}, cwd);
      return jsonOk(result);
    }

    if (action === "intelligence") {
      const engagement = api.runIndustryIntelligence(body.id, cwd);
      return jsonOk({ engagement });
    }

    if (action === "gaps") {
      const engagement = await api.runGapAnalysis(body.id, cwd);
      return jsonOk({ engagement });
    }

    if (action === "review") {
      const engagement = await api.runMultiAgentReview(body.id, cwd);
      return jsonOk({ engagement });
    }

    if (action === "package") {
      const engagement = api.produceSolutionPackage(body.id, cwd);
      return jsonOk({
        engagement,
        package: engagement.consulting?.solution_package,
        executive_html: engagement.consulting?.executive_html,
      });
    }

    if (action === "pipeline") {
      const result = await api.runConsultingPipeline(
        {
          story: body.story,
          name: body.name,
          industry: body.industry,
        },
        body.answers || {},
        cwd,
      );
      return jsonOk(result, 201);
    }

    if (action === "status") {
      return jsonOk({ status: api.getConsultingStatus(body.id, cwd) });
    }

    if (action === "llm_status") {
      return jsonOk({ llm: api.llmStatus() });
    }

    if (action === "executive_html") {
      const html = api.getExecutiveHtml(body.id, cwd);
      return new Response(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    return jsonErr("unknown action");
  } catch (e) {
    return jsonErr(e);
  }
}

export async function GET(req: Request) {
  try {
    const api = await ent();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const format = url.searchParams.get("format");
    if (id && format === "html") {
      const html = api.getExecutiveHtml(id, monorepoCwd());
      return new Response(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return jsonOk({ llm: api.llmStatus() });
  } catch (e) {
    return jsonErr(e, 500);
  }
}
