import { NextResponse } from "next/server";
import {
  getProduct,
  buildProduct,
  regenerateProduct,
  deployProduct,
  archiveProduct,
  validateProduct,
  cloneProduct,
} from "@/products";
import { FactoryError, toErrorResponse } from "@/lib/logger";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/products/:id */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    return NextResponse.json({ ok: true, product: getProduct(id) });
  } catch (e) {
    const { status, body } = toErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

/**
 * POST /api/products/:id
 * Body: { action: build|regenerate|deploy|archive|validate|clone, name? }
 */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const action = String(body?.action ?? "");

    switch (action) {
      case "build": {
        const product = await buildProduct(id);
        return NextResponse.json({ ok: true, product });
      }
      case "regenerate": {
        const result = await regenerateProduct(id);
        return NextResponse.json({ ok: true, ...result });
      }
      case "deploy": {
        const product = deployProduct(id);
        return NextResponse.json({ ok: true, product });
      }
      case "archive": {
        const product = archiveProduct(id);
        return NextResponse.json({ ok: true, product });
      }
      case "validate": {
        const result = validateProduct(id);
        return NextResponse.json({ ...result, ok: result.ok });
      }
      case "clone": {
        if (!body?.name) {
          throw new FactoryError("INVALID", "clone requires name", {
            status: 422,
          });
        }
        const product = cloneProduct(id, String(body.name));
        return NextResponse.json({ ok: true, product }, { status: 201 });
      }
      default:
        throw new FactoryError(
          "INVALID_ACTION",
          "action must be build|regenerate|deploy|archive|validate|clone",
          { status: 422 },
        );
    }
  } catch (e) {
    const { status, body } = toErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
