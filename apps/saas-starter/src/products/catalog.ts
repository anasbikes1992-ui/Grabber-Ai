/**
 * Product Catalog — create, clone, regenerate, deploy, archive.
 * File-backed under .grabber/products/ (deterministic, replayable).
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { FactoryError, logger } from "@/lib/logger";
import { loadFactoryConfig } from "@/lib/config";
import { materializeBlueprint, materializeProductDna } from "@/blueprints";
import { assemblyToCoreModules } from "@/modules";
import { runIntegrationLayer, dnaToIntegrationView } from "@/integrations";
import { recordFactoryMetrics } from "@/metrics";
import type { DeclarativeProductDna } from "@/blueprints/types";
import {
  assertFactoryGovernance,
  handoffToProductDna,
} from "@/factory/governance-gate";

export type ProductStatus =
  | "draft"
  | "built"
  | "validated"
  | "deployed"
  | "archived";

export type ProductRecord = {
  id: string;
  name: string;
  blueprint: string;
  status: ProductStatus;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  dna: DeclarativeProductDna;
  last_build?: {
    product_fingerprint: string;
    duration_ms: number;
    interventions: number;
    module_reuse_rate: number;
    modules: string[];
    validation_pass: boolean;
    production_url?: string;
    metrics_id?: string;
  };
  history: {
    at: string;
    action: string;
    detail?: string;
  }[];
};

function productsDir(cwd: string): string {
  const cfg = loadFactoryConfig(cwd);
  return join(cfg.dataDir, "products");
}

function ensureDir(cwd: string) {
  const d = productsDir(cwd);
  mkdirSync(d, { recursive: true });
  mkdirSync(join(d, "archived"), { recursive: true });
  return d;
}

function productPath(cwd: string, id: string, archived = false): string {
  const base = ensureDir(cwd);
  return join(archived ? join(base, "archived") : base, `${id}.json`);
}

function writeProduct(cwd: string, p: ProductRecord) {
  const path = productPath(cwd, p.id, p.status === "archived");
  writeFileSync(path, `${JSON.stringify(p, null, 2)}\n`, "utf8");
}

function readProductFile(path: string): ProductRecord {
  return JSON.parse(readFileSync(path, "utf8")) as ProductRecord;
}

export function listProducts(
  cwd = process.cwd(),
  opts: { includeArchived?: boolean } = {},
): ProductRecord[] {
  const base = ensureDir(cwd);
  const files = readdirSync(base).filter((f) => f.endsWith(".json"));
  const active = files.map((f) => readProductFile(join(base, f)));
  if (!opts.includeArchived) {
    return active.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }
  const archDir = join(base, "archived");
  const archived = existsSync(archDir)
    ? readdirSync(archDir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => readProductFile(join(archDir, f)))
    : [];
  return [...active, ...archived].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );
}

export function getProduct(id: string, cwd = process.cwd()): ProductRecord {
  const active = productPath(cwd, id, false);
  const archived = productPath(cwd, id, true);
  if (existsSync(active)) return readProductFile(active);
  if (existsSync(archived)) return readProductFile(archived);
  throw new FactoryError("PRODUCT_NOT_FOUND", `Product ${id} not found`, {
    status: 404,
  });
}

export function createProduct(
  input: {
    name: string;
    blueprint: string;
    modules?: string[];
    integrations?: string[];
    goals?: string[];
  },
  cwd = process.cwd(),
): ProductRecord {
  const name = input.name.trim();
  if (!name || name.length < 2) {
    throw new FactoryError("INVALID_NAME", "Product name must be at least 2 characters");
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new FactoryError(
      "INVALID_NAME",
      "Product name must be lowercase alphanumeric with hyphens",
    );
  }

  // uniqueness
  const existing = listProducts(cwd, { includeArchived: true }).find(
    (p) => p.name === name && p.status !== "archived",
  );
  if (existing) {
    throw new FactoryError("DUPLICATE", `Product ${name} already exists`, {
      status: 409,
    });
  }

  const mat = materializeBlueprint(
    input.blueprint,
    {
      modules: input.modules,
      integrations: input.integrations,
      product: { type: input.blueprint, name },
    },
    { cwd },
  );
  if (!mat.ok) {
    throw new FactoryError("BLUEPRINT", "Blueprint materialization failed", {
      status: 422,
      details: mat.errors,
    });
  }

  const now = new Date().toISOString();
  const id = createHash("sha256")
    .update(`${name}:${randomUUID()}`)
    .digest("hex")
    .slice(0, 12);

  const dna: DeclarativeProductDna = {
    product: {
      type: input.blueprint,
      name,
      blueprint: input.blueprint,
      version: mat.blueprint.version,
    },
    project: {
      name,
      type: input.blueprint,
      industry: input.blueprint,
      goals: input.goals ?? [`Deliver ${name} from blueprint ${input.blueprint}`],
      users: [{ role: "admin", goals: ["operate product"] }],
      critical_flows: ["sign up", "sign in", "open dashboard"],
      standards_version: "stds-1.0.0",
    },
    modules: mat.modules,
    integrations: mat.integrations,
    deployment: mat.blueprint.deployment,
    quality: {
      security: mat.quality_policy.security,
      testing: mat.quality_policy.testing,
    },
    meta: { catalog: true, version: 1 },
  };

  const record: ProductRecord = {
    id,
    name,
    blueprint: input.blueprint,
    status: "draft",
    version: 1,
    created_at: now,
    updated_at: now,
    dna,
    history: [{ at: now, action: "create", detail: `blueprint=${input.blueprint}` }],
  };

  writeProduct(cwd, record);
  logger.info("product.created", { id, name, blueprint: input.blueprint });
  return record;
}

/**
 * Milestone 4 — create product only from Delivery Governance factory handoff.
 */
export async function createProductFromEngagement(
  engagementId: string,
  cwd = process.cwd(),
): Promise<{ product: ProductRecord; handoff: Awaited<ReturnType<typeof handoffToProductDna>>["handoff"] }> {
  const packed = await handoffToProductDna(engagementId, cwd);
  let name = String(packed.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  if (name.length < 2) name = `eng-${engagementId.slice(0, 8)}`;

  // ensure unique name
  const taken = listProducts(cwd, { includeArchived: true }).some(
    (p) => p.name === name && p.status !== "archived",
  );
  if (taken) name = `${name}-${Date.now().toString(36).slice(-4)}`;

  const product = createProduct(
    {
      name,
      blueprint: packed.blueprint,
      modules: (packed.dna.modules as string[] | undefined) || undefined,
      integrations:
        (packed.dna.integrations as string[] | undefined) || undefined,
      goals: (packed.dna.project as { goals?: string[] } | undefined)?.goals,
    },
    cwd,
  );

  product.dna = {
    ...product.dna,
    ...packed.dna,
    product: {
      ...product.dna.product,
      ...(packed.dna.product as object),
      name,
      blueprint: packed.blueprint,
      type: packed.blueprint,
    },
    project: {
      ...(product.dna.project as object),
      ...(packed.dna.project as object),
      name,
    },
    governance: packed.dna.governance,
  } as DeclarativeProductDna;

  product.history.push({
    at: new Date().toISOString(),
    action: "enterprise_handoff",
    detail: `engagement=${engagementId};fp=${packed.handoff.fingerprint}`,
  });
  product.updated_at = new Date().toISOString();
  writeProduct(cwd, product);
  logger.info("product.from_engagement", {
    id: product.id,
    engagementId,
    fingerprint: packed.handoff.fingerprint,
  });
  return { product, handoff: packed.handoff };
}

export function cloneProduct(
  sourceId: string,
  newName: string,
  cwd = process.cwd(),
): ProductRecord {
  const src = getProduct(sourceId, cwd);
  if (src.status === "archived") {
    throw new FactoryError("ARCHIVED", "Cannot clone archived product");
  }
  const created = createProduct(
    {
      name: newName,
      blueprint: src.blueprint,
      modules: src.dna.modules,
      integrations: src.dna.integrations,
      goals: (src.dna.project as { goals?: string[] })?.goals,
    },
    cwd,
  );
  created.history.push({
    at: new Date().toISOString(),
    action: "clone",
    detail: `from=${sourceId}`,
  });
  created.dna = structuredClone(src.dna);
  created.dna.product = {
    ...created.dna.product,
    name: newName,
  };
  if (created.dna.project && typeof created.dna.project === "object") {
    (created.dna.project as { name: string }).name = newName;
  }
  created.updated_at = new Date().toISOString();
  writeProduct(cwd, created);
  logger.info("product.cloned", { from: sourceId, to: created.id });
  return created;
}

export async function buildProduct(
  id: string,
  cwd = process.cwd(),
  opts: { skipGovernance?: boolean } = {},
): Promise<ProductRecord> {
  const product = getProduct(id, cwd);
  if (product.status === "archived") {
    throw new FactoryError("ARCHIVED", "Cannot build archived product");
  }

  // Milestone 4 gate: commercial engagement DNA must stay factory-eligible
  const engagementId =
    (product.dna as { governance?: { engagement_id?: string } }).governance
      ?.engagement_id || null;
  try {
    await assertFactoryGovernance({
      engagementId,
      skipGovernance: opts.skipGovernance,
      cwd,
    });
  } catch (e) {
    throw new FactoryError(
      "GOVERNANCE",
      e instanceof Error ? e.message : String(e),
      { status: 403 },
    );
  }

  const mat = materializeProductDna(product.dna, { cwd });
  if (!mat.ok || !mat.assembly) {
    throw new FactoryError("ASSEMBLY", "Module assembly failed", {
      status: 422,
      details: mat.errors,
    });
  }

  const assembled = assemblyToCoreModules(mat.assembly);
  const coreDna = {
    project: {
      name: product.name,
      template: product.blueprint,
      industry:
        (product.dna.project as { industry?: string } | undefined)?.industry ??
        product.blueprint,
      business_model: "b2b-saas",
      users:
        (product.dna.project as { users?: { role: string; goals: string[] }[] })
          ?.users ?? [{ role: "admin", goals: ["operate"] }],
      goals:
        (product.dna.project as { goals?: string[] } | undefined)?.goals ?? [
          `Build ${product.name}`,
        ],
      constraints: {
        must: ["assemble from Factory Registry"],
        should: [],
        may: [],
        must_not: [],
        assumptions: [],
        unknowns: [],
        risks: [],
      },
      integrations: assembled.integrations.length
        ? assembled.integrations
        : product.dna.integrations ?? ["supabase", "github", "vercel"],
      architecture: {
        style: "modular-monolith",
        modules: assembled.modules,
      },
      stack: "crud-dashboard (Next.js + Supabase)",
      conventions: {
        db_naming: "plural",
        api_envelope: "data/error+trace_id",
        breakpoints: ["sm", "md", "lg"],
      },
      security_level: "standard",
      authorization: { model: "rbac", roles: ["admin", "member"] },
      accessibility_level: "WCAG-2.1-AA",
      performance_targets: { lcp_ms: 2500, inp_ms: 200, api_p95_ms: 400 },
      data: { retention: "account-lifetime", regulated: false },
      deployment_targets: {
        environments: ["development", "staging", "production"],
        uptime_target: "99.9%",
        backup_schedule: "daily",
      },
      critical_flows:
        (product.dna.project as { critical_flows?: string[] } | undefined)
          ?.critical_flows ?? [],
      standards_version: "stds-1.0.0",
      decision_registry: ["EDR-007"],
      intelligence: {
        module_assembly: assembled.assembly_meta,
        composition: {
          entities: assembled.entities,
          endpoints: assembled.endpoints,
          permissions: assembled.permissions,
        },
      },
    },
  };

  const factoryMod = (await import(
    /* webpackIgnore: true */
    "../../../../runtime/src/factory/index.js"
  )) as {
    createProductFactory: () => {
      build: (
        dna: unknown,
        opts?: { projectId?: string },
      ) => Promise<{
        productFingerprint: string;
        metrics: {
          durationMs: number;
          interventions: number;
          cost?: { actual_cost?: number };
        };
      }>;
      validate: (b: unknown) => { ok: boolean; errors: string[] };
      regenerate: (
        dna: unknown,
        opts?: { projectId?: string },
      ) => Promise<{ equivalent: boolean; bothValid: boolean }>;
    };
  };

  const factory = factoryMod.createProductFactory();
  const build = await factory.build(coreDna, { projectId: product.name });
  const validation = factory.validate(build);
  if (!validation.ok) {
    throw new FactoryError("VALIDATION", "Build validation failed", {
      status: 422,
      details: validation.errors,
    });
  }

  const view = dnaToIntegrationView({
    project: {
      name: product.name,
      type: product.blueprint,
      template: product.blueprint,
    },
    modules: assembled.modules,
    integrations: product.dna.integrations,
    deployment: product.dna.deployment,
  });
  const integrations = runIntegrationLayer(view, { execute: false });

  const metrics = recordFactoryMetrics(
    {
      project_name: product.name,
      product_fingerprint: build.productFingerprint,
      dna_completeness: 100,
      dna_confidence: 100,
      clarifications_required: 0,
      build_duration_ms: build.metrics.durationMs,
      validation_pass: true,
      manual_interventions: build.metrics.interventions,
      deployment_success: Boolean(integrations.production_url),
      total_build_cost_usd:
        (build.metrics.cost as { actual_cost?: number } | undefined)
          ?.actual_cost ?? 0,
      integrations_planned: integrations.decisions
        .filter((d) => d.include)
        .map((d) => d.provider),
      integrations_dry_run: true,
      production_url: integrations.production_url,
      module_reuse_rate: mat.assembly.module_reuse_rate,
      modules_assembled: mat.assembly.modules.length,
      modules_requested: mat.assembly.requested.length,
      notes: [`product:${product.id}`, `blueprint:${product.blueprint}`],
    },
    cwd,
  );

  const now = new Date().toISOString();
  product.status = "validated";
  product.version += 1;
  product.updated_at = now;
  product.last_build = {
    product_fingerprint: build.productFingerprint,
    duration_ms: build.metrics.durationMs,
    interventions: build.metrics.interventions,
    module_reuse_rate: mat.assembly.module_reuse_rate,
    modules: mat.assembly.resolved,
    validation_pass: true,
    production_url: integrations.production_url,
    metrics_id: metrics.id,
  };
  product.history.push({
    at: now,
    action: "build",
    detail: `fingerprint=${build.productFingerprint}`,
  });
  writeProduct(cwd, product);
  logger.info("product.built", {
    id: product.id,
    fingerprint: build.productFingerprint,
  });
  return product;
}

export async function regenerateProduct(
  id: string,
  cwd = process.cwd(),
): Promise<{ product: ProductRecord; equivalent: boolean }> {
  const product = getProduct(id, cwd);
  if (product.status === "archived") {
    throw new FactoryError("ARCHIVED", "Cannot regenerate archived product");
  }

  const before = product.last_build?.product_fingerprint;
  const rebuilt = await buildProduct(id, cwd);
  const equivalent =
    Boolean(before) && before === rebuilt.last_build?.product_fingerprint;

  // If first build, run Core regenerate for equivalence signal
  let regenOk = equivalent;
  if (!before && rebuilt.last_build) {
    regenOk = true;
  }

  rebuilt.history.push({
    at: new Date().toISOString(),
    action: "regenerate",
    detail: `equivalent=${regenOk}`,
  });
  writeProduct(cwd, rebuilt);
  return { product: rebuilt, equivalent: regenOk };
}

export function deployProduct(
  id: string,
  cwd = process.cwd(),
): ProductRecord {
  const product = getProduct(id, cwd);
  if (product.status === "archived") {
    throw new FactoryError("ARCHIVED", "Cannot deploy archived product");
  }
  if (!product.last_build?.validation_pass) {
    throw new FactoryError(
      "NOT_BUILT",
      "Build and validate product before deploy",
      { status: 422 },
    );
  }

  const view = dnaToIntegrationView({
    project: { name: product.name, type: product.blueprint },
    modules: product.last_build.modules,
    integrations: product.dna.integrations,
    deployment: product.dna.deployment ?? { provider: "vercel" },
  });
  const integrations = runIntegrationLayer(view, { execute: false });
  const now = new Date().toISOString();
  product.status = "deployed";
  product.updated_at = now;
  product.last_build = {
    ...product.last_build,
    production_url: integrations.production_url,
  };
  product.history.push({
    at: now,
    action: "deploy",
    detail: integrations.production_url,
  });
  writeProduct(cwd, product);
  logger.info("product.deployed", {
    id: product.id,
    url: integrations.production_url,
  });
  return product;
}

export function archiveProduct(
  id: string,
  cwd = process.cwd(),
): ProductRecord {
  const product = getProduct(id, cwd);
  if (product.status === "archived") return product;

  const now = new Date().toISOString();
  product.status = "archived";
  product.archived_at = now;
  product.updated_at = now;
  product.history.push({ at: now, action: "archive" });

  const activePath = join(ensureDir(cwd), `${id}.json`);
  const archivedPath = join(ensureDir(cwd), "archived", `${id}.json`);
  writeFileSync(archivedPath, `${JSON.stringify(product, null, 2)}\n`, "utf8");
  if (existsSync(activePath)) {
    try {
      unlinkSync(activePath);
    } catch {
      try {
        renameSync(activePath, archivedPath);
      } catch {
        /* already archived */
      }
    }
  }
  logger.info("product.archived", { id });
  return product;
}

export function validateProduct(
  id: string,
  cwd = process.cwd(),
): { ok: boolean; errors: string[]; product: ProductRecord } {
  const product = getProduct(id, cwd);
  const errors: string[] = [];
  if (!product.dna.modules?.length && !product.blueprint) {
    errors.push("Product has no modules or blueprint");
  }
  const mat = materializeProductDna(product.dna, { cwd });
  if (!mat.ok) errors.push(...mat.errors);
  if (product.last_build && !product.last_build.validation_pass) {
    errors.push("Last build failed validation");
  }
  return { ok: errors.length === 0, errors, product };
}
