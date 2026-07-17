import { NextResponse } from "next/server";
import {
  listProducts,
  createProduct,
  getProduct,
} from "@/products";
import { FactoryError, toErrorResponse } from "@/lib/logger";

export const runtime = "nodejs";

/** GET /api/products */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeArchived = url.searchParams.get("archived") === "1";
    const id = url.searchParams.get("id");
    if (id) {
      return NextResponse.json({ ok: true, product: getProduct(id) });
    }
    return NextResponse.json({
      ok: true,
      products: listProducts(process.cwd(), { includeArchived }),
    });
  } catch (e) {
    const { status, body } = toErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}

/** POST /api/products — create */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name || !body?.blueprint) {
      throw new FactoryError(
        "INVALID",
        "name and blueprint are required",
        { status: 422 },
      );
    }
    const product = createProduct(
      {
        name: String(body.name),
        blueprint: String(body.blueprint),
        modules: body.modules,
        integrations: body.integrations,
        goals: body.goals,
      },
      process.cwd(),
    );
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (e) {
    const { status, body } = toErrorResponse(e);
    return NextResponse.json(body, { status });
  }
}
