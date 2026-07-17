import { loadBlueprint } from "./registry";
import type {
  BlueprintMaterializeResult,
  DeclarativeProductDna,
} from "./types";
import { assembleModules } from "@/modules";
import type { AssemblyResult } from "@/modules";

/**
 * Materialize a blueprint (+ optional DNA overrides) into an explicit module set.
 * DNA may list modules; blueprint required modules are always unioned in.
 */
export function materializeBlueprint(
  blueprintId: string,
  dna: DeclarativeProductDna = {},
  opts: { cwd?: string; includeOptional?: boolean } = {},
): BlueprintMaterializeResult & { assembly?: AssemblyResult } {
  const cwd = opts.cwd ?? process.cwd();
  const errors: string[] = [];

  let blueprint;
  try {
    blueprint = loadBlueprint(blueprintId, cwd);
  } catch (e) {
    return {
      ok: false,
      blueprint: {} as BlueprintMaterializeResult["blueprint"],
      modules: [],
      integrations: [],
      product_type: "",
      quality_policy: {
        security: "standard",
        testing: "required",
        min_dna_confidence: 0,
        min_dna_completeness: 0,
        min_module_reuse_rate: 0,
      },
      errors: [e instanceof Error ? e.message : String(e)],
    };
  }

  const fromDna = dna.modules ?? [];
  const required = blueprint.modules.required;
  const optional = opts.includeOptional ? blueprint.modules.optional : [];
  // Declarative: DNA modules + blueprint required (factory resolves deps)
  const modules = unique([...required, ...optional, ...fromDna]);

  const integrations = unique([
    ...blueprint.integrations.required,
    ...(dna.integrations ?? []),
    ...blueprint.integrations.recommended,
  ]);

  const assembly = assembleModules(modules, {
    productType: blueprint.product_type,
    cwd,
  });

  if (!assembly.ok) {
    errors.push(...assembly.errors);
  }

  if (assembly.module_reuse_rate < blueprint.quality.min_module_reuse_rate) {
    errors.push(
      `Module reuse ${assembly.module_reuse_rate} below blueprint minimum ${blueprint.quality.min_module_reuse_rate}`,
    );
  }

  return {
    ok: errors.length === 0,
    blueprint,
    modules: assembly.resolved.length ? assembly.resolved : modules,
    integrations,
    product_type: blueprint.product_type,
    quality_policy: blueprint.quality,
    assembly,
    errors,
  };
}

/**
 * Expand a declarative reference DNA (product.type / blueprint / modules)
 * into a fully resolved assembly plan.
 */
export function materializeProductDna(
  dna: DeclarativeProductDna,
  opts: { cwd?: string } = {},
): BlueprintMaterializeResult & { assembly?: AssemblyResult; name: string } {
  const blueprintId =
    dna.product?.blueprint ||
    dna.product?.type ||
    (dna.project as { type?: string } | undefined)?.type ||
    "saas";

  const result = materializeBlueprint(blueprintId, dna, opts);
  const name =
    dna.product?.name ||
    (dna.project as { name?: string } | undefined)?.name ||
    `${blueprintId}-product`;

  return { ...result, name };
}

function unique(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}
