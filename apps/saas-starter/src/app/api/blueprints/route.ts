import { NextResponse } from "next/server";
import {
  listBlueprints,
  loadBlueprint,
  materializeBlueprint,
  goldenBlueprints,
} from "@/blueprints";

export const runtime = "nodejs";

/** GET /api/blueprints — list product blueprints */
export async function GET() {
  const cwd = process.cwd();
  const ids = listBlueprints(cwd);
  const golden = goldenBlueprints(cwd);
  return NextResponse.json({
    ok: true,
    blueprints: ids.map((id) => {
      const b = loadBlueprint(id, cwd);
      return {
        id,
        title: b.title,
        version: b.version,
        product_type: b.product_type,
        golden: golden.includes(id),
        required_modules: b.modules.required,
        min_module_reuse_rate: b.quality.min_module_reuse_rate,
      };
    }),
  });
}

/** POST /api/blueprints — materialize a blueprint */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errors: ["invalid JSON"] }, { status: 400 });
  }
  const b = body as {
    blueprint?: string;
    modules?: string[];
    integrations?: string[];
    includeOptional?: boolean;
  };
  if (!b.blueprint) {
    return NextResponse.json(
      { ok: false, errors: ["blueprint id required"] },
      { status: 422 },
    );
  }

  const result = materializeBlueprint(
    b.blueprint,
    { modules: b.modules, integrations: b.integrations },
    { cwd: process.cwd(), includeOptional: b.includeOptional },
  );

  return NextResponse.json({
    ...result,
    ok: result.ok,
    assembly: result.assembly
      ? {
          resolved: result.assembly.resolved,
          module_reuse_rate: result.assembly.module_reuse_rate,
          composition: result.assembly.composition,
        }
      : null,
  });
}
