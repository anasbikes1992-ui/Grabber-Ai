/**
 * Product Factory CLI ops (Track B) — invoked by grabber CLI.
 * Usage: npx tsx scripts/product-cli.ts <command> [args]
 */
import {
  createProduct,
  createProductFromEngagement,
  listProducts,
  getProduct,
  buildProduct,
  regenerateProduct,
  deployProduct,
  archiveProduct,
  validateProduct,
  cloneProduct,
} from "../src/products/catalog";
import { buildAnalyticsDashboard } from "../src/metrics/analytics";
import { buildFactoryCatalog } from "../src/factory/registry-v2";
import { loadFactoryConfig } from "../src/lib/config";
import { runGoldenReferenceSuite, runReferenceProduct } from "../src/blueprints/reference";
import { listBlueprints } from "../src/blueprints/registry";
import {
  assertFactoryGovernance,
  handoffToProductDna,
} from "../src/factory/governance-gate";

function out(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

async function main(argv: string[]) {
  const [cmd, ...rest] = argv;
  const cwd = process.cwd();

  switch (cmd) {
    case "create": {
      const blueprint = rest[0];
      const name = rest[1] ?? `${blueprint}-${Date.now().toString(36)}`;
      if (!blueprint) throw new Error("usage: create <blueprint> [name]");
      const product = createProduct({ name, blueprint }, cwd);
      out({ ok: true, product });
      return 0;
    }
    case "list": {
      out({ ok: true, products: listProducts(cwd) });
      return 0;
    }
    case "get": {
      const id = rest[0];
      if (!id) throw new Error("usage: get <id>");
      out({ ok: true, product: getProduct(id, cwd) });
      return 0;
    }
    case "build": {
      const id = rest[0];
      if (!id) throw new Error("usage: build <id|name>");
      const product = await resolveAndBuild(id, cwd);
      out({ ok: true, product });
      return 0;
    }
    case "regenerate": {
      const id = rest[0];
      if (!id) throw new Error("usage: regenerate <id|name>");
      const p = resolveId(id, cwd);
      const result = await regenerateProduct(p, cwd);
      out({ ok: true, ...result });
      return 0;
    }
    case "validate": {
      const id = rest[0];
      if (!id) throw new Error("usage: validate <id|name>");
      const result = validateProduct(resolveId(id, cwd), cwd);
      out(result);
      return result.ok ? 0 : 1;
    }
    case "deploy": {
      const id = rest[0];
      if (!id) throw new Error("usage: deploy <id|name>");
      const product = deployProduct(resolveId(id, cwd), cwd);
      out({ ok: true, product });
      return 0;
    }
    case "archive": {
      const id = rest[0];
      if (!id) throw new Error("usage: archive <id|name>");
      const product = archiveProduct(resolveId(id, cwd), cwd);
      out({ ok: true, product });
      return 0;
    }
    case "clone": {
      const id = rest[0];
      const name = rest[1];
      if (!id || !name) throw new Error("usage: clone <id|name> <new-name>");
      const product = cloneProduct(resolveId(id, cwd), name, cwd);
      out({ ok: true, product });
      return 0;
    }
    case "status": {
      const cfg = loadFactoryConfig(cwd);
      const products = listProducts(cwd);
      const analytics = buildAnalyticsDashboard(cwd);
      out({
        ok: true,
        version: cfg.version,
        coreVersion: cfg.coreVersion,
        products: products.length,
        builds: analytics.builds.total,
        avg_reuse: analytics.builds.avg_module_reuse_rate,
        validation_pass_rate: analytics.builds.validation_pass_rate,
        blueprints: listBlueprints(cwd),
      });
      return 0;
    }
    case "metrics": {
      out({ ok: true, analytics: buildAnalyticsDashboard(cwd) });
      return 0;
    }
    case "catalog": {
      out({ ok: true, catalog: buildFactoryCatalog(cwd) });
      return 0;
    }
    case "reference": {
      const product = rest[0] ?? "booking";
      if (product === "all") {
        out(await runGoldenReferenceSuite({ cwd }));
      } else {
        out(await runReferenceProduct(product, { cwd, regenerate: true }));
      }
      return 0;
    }
    case "doctor": {
      const cfg = loadFactoryConfig(cwd);
      const catalog = buildFactoryCatalog(cwd);
      const analytics = buildAnalyticsDashboard(cwd);
      const checks = [
        { name: "config", ok: Boolean(cfg.version) },
        { name: "modules", ok: catalog.summary.module_count >= 15 },
        { name: "blueprints", ok: catalog.summary.blueprint_count >= 5 },
        { name: "modules_complete", ok: catalog.modules.every((m) => m.complete) },
        { name: "golden_blueprints", ok: catalog.summary.golden_count >= 4 },
      ];
      const ok = checks.every((c) => c.ok);
      out({
        ok,
        version: cfg.version,
        coreVersion: cfg.coreVersion,
        catalog: catalog.summary,
        builds: analytics.builds.total,
        checks,
      });
      return ok ? 0 : 1;
    }
    case "handoff": {
      // Inspect factory handoff for an engagement (does not create product)
      const engagementId = rest[0];
      if (!engagementId) throw new Error("usage: handoff <engagementId>");
      const packed = await handoffToProductDna(engagementId, cwd);
      out({ ok: true, ...packed });
      return 0;
    }
    case "from-engagement": {
      // Create product from approved Business OS engagement
      const engagementId = rest[0];
      if (!engagementId) throw new Error("usage: from-engagement <engagementId>");
      const result = await createProductFromEngagement(engagementId, cwd);
      out({ ok: true, ...result });
      return 0;
    }
    case "gate": {
      const engagementId = rest[0];
      if (!engagementId) throw new Error("usage: gate <engagementId>");
      const gate = await assertFactoryGovernance({ engagementId, cwd });
      out({ ok: true, gate });
      return 0;
    }
    default:
      throw new Error(
        `unknown product command "${cmd}". Use create|list|build|regenerate|validate|deploy|archive|clone|status|metrics|catalog|reference|doctor|handoff|from-engagement|gate`,
      );
  }
}

function resolveId(idOrName: string, cwd: string): string {
  try {
    getProduct(idOrName, cwd);
    return idOrName;
  } catch {
    const hit = listProducts(cwd, { includeArchived: true }).find(
      (p) => p.name === idOrName || p.id === idOrName,
    );
    if (!hit) throw new Error(`Product not found: ${idOrName}`);
    return hit.id;
  }
}

async function resolveAndBuild(idOrName: string, cwd: string) {
  return buildProduct(resolveId(idOrName, cwd), cwd);
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code ?? 0),
  (err) => {
    console.error(JSON.stringify({ ok: false, error: err.message ?? String(err) }, null, 2));
    process.exit(1);
  },
);
