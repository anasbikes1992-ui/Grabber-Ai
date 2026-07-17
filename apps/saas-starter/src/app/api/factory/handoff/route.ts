import { NextResponse } from "next/server";
import {
  assertFactoryGovernance,
  handoffToProductDna,
} from "@/factory/governance-gate";
import { createProductFromEngagement } from "@/products";
import { FactoryError, toErrorResponse } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/factory/handoff?engagement_id=...
 * Milestone 4 — inspect factory eligibility + DNA.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const engagementId = url.searchParams.get("engagement_id");
    if (!engagementId) {
      throw new FactoryError("INVALID", "engagement_id required", {
        status: 422,
      });
    }
    const packed = await handoffToProductDna(engagementId);
    return NextResponse.json({ ok: true, ...packed });
  } catch (e) {
    const { status, body } = toErrorResponse(e);
    return NextResponse.json(body, { status: status === 500 ? 403 : status });
  }
}

/**
 * POST /api/factory/handoff
 * Body: { engagement_id, action?: "inspect" | "create" }
 * create → Product Catalog entry from approved DNA only.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const engagementId = String(body.engagement_id || "");
    if (!engagementId) {
      throw new FactoryError("INVALID", "engagement_id required", {
        status: 422,
      });
    }
    if (body.action === "inspect" || !body.action) {
      const gate = await assertFactoryGovernance({ engagementId });
      if (body.action === "inspect") {
        return NextResponse.json({ ok: true, gate });
      }
    }
    if (body.action === "create" || body.create === true) {
      const result = await createProductFromEngagement(engagementId);
      return NextResponse.json({ ok: true, ...result }, { status: 201 });
    }
    const packed = await handoffToProductDna(engagementId);
    return NextResponse.json({ ok: true, ...packed });
  } catch (e) {
    const { status, body } = toErrorResponse(e);
    return NextResponse.json(body, { status: status === 500 ? 403 : status });
  }
}
