import { resolveModuleCompatibility, normalizeAlias } from "./compatibility";
import {
  loadModuleBuilder,
  loadModuleFragment,
  modulesRoot,
} from "./registry";
import type { AssembledModule, AssemblyResult } from "./types";
import { join } from "node:path";

/**
 * Business Module Assembly — DNA selects modules; factory assembles catalog entries.
 * Not CRUD generation: production capability assembly.
 */
export function assembleModules(
  requestedModules: string[],
  opts: { productType?: string; cwd?: string } = {},
): AssemblyResult {
  const cwd = opts.cwd ?? process.cwd();
  const product_type = (opts.productType ?? "saas").toLowerCase();
  const requested = unique(requestedModules.map(normalizeAlias));

  const compatibility = resolveModuleCompatibility(requested, {
    productType: product_type,
    cwd,
  });

  const errors = compatibility.issues
    .filter((i) => i.severity === "error")
    .map((i) => i.message);

  const unknown = compatibility.issues
    .filter((i) => i.code === "UNKNOWN_MODULE")
    .map((i) => i.module!)
    .filter(Boolean);

  const modules: AssembledModule[] = [];
  const root = modulesRoot(cwd);

  for (const name of compatibility.resolved) {
    if (unknown.includes(name)) continue;
    try {
      const builder = loadModuleBuilder(name, cwd);
      const fragment = loadModuleFragment(name, cwd);
      modules.push({
        name,
        version: builder.version,
        title: builder.title,
        builder,
        fragment,
        path: join(root, name),
      });
    } catch (e) {
      errors.push(
        `Failed to load module ${name}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  const composition = {
    entities: unique(modules.flatMap((m) => m.builder.artifacts.entities)),
    endpoints: unique(modules.flatMap((m) => m.builder.artifacts.endpoints)),
    ui: unique(modules.flatMap((m) => m.builder.artifacts.ui)),
    permissions: unique(
      modules.flatMap((m) => m.builder.artifacts.permissions),
    ),
    integrations: unique(
      modules.flatMap((m) => m.fragment.contributes.integrations ?? []),
    ),
  };

  const from_registry = modules.length;
  const total_requested = Math.max(requested.length, 1);
  // Reuse rate: resolved registered modules / (requested + auto-deps from registry)
  // Higher is better — product is mostly catalog assembly
  const module_reuse_rate =
    compatibility.resolved.length === 0
      ? 0
      : from_registry / compatibility.resolved.length;

  return {
    ok: errors.length === 0 && modules.length > 0,
    product_type,
    requested,
    resolved: compatibility.resolved,
    modules,
    compatibility,
    composition,
    module_reuse_rate: Number(module_reuse_rate.toFixed(4)),
    reuse: {
      from_registry,
      unknown,
      total_requested,
    },
    errors,
  };
}

/**
 * Map assembly into Core-compatible DNA modules list + fragment contributions.
 */
export function assemblyToCoreModules(assembly: AssemblyResult): {
  modules: string[];
  integrations: string[];
  entities: string[];
  endpoints: string[];
  permissions: string[];
  assembly_meta: {
    module_reuse_rate: number;
    resolved: { name: string; version: string }[];
  };
} {
  return {
    modules: assembly.resolved,
    integrations: assembly.composition.integrations,
    entities: assembly.composition.entities,
    endpoints: assembly.composition.endpoints,
    permissions: assembly.composition.permissions,
    assembly_meta: {
      module_reuse_rate: assembly.module_reuse_rate,
      resolved: assembly.modules.map((m) => ({
        name: m.name,
        version: m.version,
      })),
    },
  };
}

function unique(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}
