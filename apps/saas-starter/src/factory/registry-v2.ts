/**
 * Factory Registry v2 — catalog with quality score, reuse rate, compatibility.
 * Reads existing modules/registry.json; enriches with runtime stats.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadModuleBuilder,
  loadRegistry,
  modulesRoot,
} from "@/modules/registry";
import { listFactoryMetrics } from "@/metrics";
import type { ModuleBuilder } from "@/modules/types";
import { listBlueprints, loadBlueprint } from "@/blueprints";

export type CatalogModule = {
  name: string;
  title: string;
  version: string;
  requires: string[];
  optional: string[];
  conflicts: string[];
  supports: string[];
  quality_score: number;
  reuse_rate: number;
  usage_count: number;
  entities: string[];
  endpoints: string[];
  ui: string[];
  permissions: string[];
  path: string;
  complete: boolean;
};

export type CatalogBlueprint = {
  id: string;
  title: string;
  version: string;
  product_type: string;
  golden: boolean;
  required_modules: string[];
  optional_modules: string[];
  integrations: string[];
  min_module_reuse_rate: number;
  quality_score: number;
};

export type FactoryCatalog = {
  version: string;
  kind: "factory_catalog_v2";
  modules: CatalogModule[];
  blueprints: CatalogBlueprint[];
  summary: {
    module_count: number;
    blueprint_count: number;
    golden_count: number;
    avg_module_quality: number;
    avg_reuse_rate: number;
  };
};

function moduleComplete(name: string, root: string): boolean {
  const base = join(root, name);
  const need = [
    "builder.json",
    "project-dna.fragment.json",
    "schema",
    "api",
    "frontend",
    "backend",
    "tests",
    "docs",
  ];
  return need.every((n) => existsSync(join(base, n)));
}

function qualityFromBuilder(b: ModuleBuilder, complete: boolean): number {
  let score = 50;
  if (complete) score += 20;
  if (b.artifacts.entities.length >= 1) score += 5;
  if (b.artifacts.endpoints.length >= 1) score += 5;
  if (b.artifacts.ui.length >= 1) score += 5;
  if (b.artifacts.permissions.length >= 1) score += 5;
  if (b.requires.length >= 0) score += 5;
  if (b.supports.length >= 2) score += 5;
  // version maturity
  const [maj, min] = b.version.split(".").map(Number);
  if (maj >= 1) score += 5;
  if ((min ?? 0) >= 1) score += 5;
  return Math.min(100, score);
}

function reuseStats(cwd: string): Map<string, { count: number; sumRate: number }> {
  const map = new Map<string, { count: number; sumRate: number }>();
  for (const row of listFactoryMetrics(cwd)) {
    const rate = row.module_reuse_rate ?? 0;
    // attribute reuse to all modules in notes assembly if present — else global
    const key = "_global";
    const cur = map.get(key) ?? { count: 0, sumRate: 0 };
    cur.count += 1;
    cur.sumRate += rate;
    map.set(key, cur);
  }
  return map;
}

export function buildFactoryCatalog(cwd = process.cwd()): FactoryCatalog {
  const reg = loadRegistry(cwd);
  const root = modulesRoot(cwd);
  const globalReuse = reuseStats(cwd).get("_global");
  const avgReuse =
    globalReuse && globalReuse.count
      ? globalReuse.sumRate / globalReuse.count
      : 1;

  const modules: CatalogModule[] = Object.entries(reg.modules).map(
    ([name, entry]) => {
      let builder: ModuleBuilder;
      try {
        builder = loadModuleBuilder(name, cwd);
      } catch {
        builder = {
          id: `module.${name}`,
          name,
          title: entry.title,
          version: entry.version,
          kind: "business_module",
          requires: entry.requires,
          optional: entry.optional,
          conflicts: entry.conflicts,
          supports: entry.supports,
          surfaces: {},
          artifacts: { entities: [], endpoints: [], ui: [], permissions: [] },
        };
      }
      const complete = moduleComplete(name, root);
      // per-module usage from metrics notes is approximate; use global avg when built
      const usage_count = listFactoryMetrics(cwd).filter((m) =>
        (m.notes ?? []).some((n) => n.includes(name)),
      ).length;

      return {
        name,
        title: entry.title,
        version: builder.version || entry.version,
        requires: entry.requires,
        optional: entry.optional,
        conflicts: entry.conflicts,
        supports: entry.supports,
        quality_score: qualityFromBuilder(builder, complete),
        reuse_rate: Number(avgReuse.toFixed(4)),
        usage_count,
        entities: builder.artifacts.entities,
        endpoints: builder.artifacts.endpoints,
        ui: builder.artifacts.ui,
        permissions: builder.artifacts.permissions,
        path: entry.path,
        complete,
      };
    },
  );

  const blueprints: CatalogBlueprint[] = listBlueprints(cwd).map((id) => {
    const b = loadBlueprint(id, cwd);
    const regBp = JSON.parse(
      readFileSyncSafe(join(blueprintsRootSafe(cwd), "registry.json")),
    ) as { blueprints: Record<string, { golden?: boolean }> };
    const golden = Boolean(regBp.blueprints[id]?.golden);
    const moduleScores = b.modules.required
      .map((m) => modules.find((x) => x.name === m)?.quality_score ?? 70);
    const quality_score = moduleScores.length
      ? Math.round(
          moduleScores.reduce((a, c) => a + c, 0) / moduleScores.length,
        )
      : 70;

    return {
      id,
      title: b.title,
      version: b.version,
      product_type: b.product_type,
      golden,
      required_modules: b.modules.required,
      optional_modules: b.modules.optional,
      integrations: b.integrations.required,
      min_module_reuse_rate: b.quality.min_module_reuse_rate,
      quality_score,
    };
  });

  const avg_module_quality = modules.length
    ? modules.reduce((s, m) => s + m.quality_score, 0) / modules.length
    : 0;

  return {
    version: "2.0.0",
    kind: "factory_catalog_v2",
    modules: modules.sort((a, b) => a.name.localeCompare(b.name)),
    blueprints: blueprints.sort((a, b) => a.id.localeCompare(b.id)),
    summary: {
      module_count: modules.length,
      blueprint_count: blueprints.length,
      golden_count: blueprints.filter((b) => b.golden).length,
      avg_module_quality: Number(avg_module_quality.toFixed(1)),
      avg_reuse_rate: Number(avgReuse.toFixed(4)),
    },
  };
}

function blueprintsRootSafe(cwd: string): string {
  const c = [
    join(cwd, "blueprints"),
    join(cwd, "apps/saas-starter/blueprints"),
  ];
  for (const p of c) {
    if (existsSync(join(p, "registry.json"))) return p;
  }
  return join(cwd, "blueprints");
}

function readFileSyncSafe(path: string): string {
  return readFileSync(path, "utf8");
}
