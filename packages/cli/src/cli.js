// grabber CLI v2.0 — commercial Product Factory DX on frozen Grabber Core.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createGrabberClient } from '@grabber/sdk';
import { ExtensionRuntime } from '../../../runtime/src/extensions/index.js';
import { defineSkill } from '@grabber/skill-sdk';
import { createProductFactory } from '../../../runtime/src/factory/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const SAAS = join(ROOT, 'apps/saas-starter');

const HELP = `
grabber — Grabber AI Studio v3.0 Enterprise + Product Factory CLI

Core is FROZEN. Product Factory + Enterprise Business OS (Track B).

Usage:
  grabber <command> [args]

Product Factory:
  create <blueprint> [name]   Create product (saas|crm|marketplace|booking|inventory)
  build <id|name>             DNA → assembly → Core build → metrics
  regenerate <id|name>        Rebuild deterministically
  validate <id|name>          Validate product DNA + assembly
  deploy <id|name>            Integration plan + production URL
  status                      Factory status
  metrics                     Analytics dashboard JSON
  doctor                      Health checks (modules, blueprints, config)

Catalog:
  list                        List products
  clone <id|name> <new-name>  Clone product
  archive <id|name>           Archive product
  catalog                     Factory Registry v2 (modules + blueprints)
  reference [product|all]     Golden reference run

Enterprise (milestones 1–6):
  enterprise seed [name] [industry]   Full governance path → factory_ready
  enterprise consult [name] [story…]  Business consulting → package (no factory)
  enterprise list                     List engagements
  enterprise handoff <engagementId>   Approved DNA for Product Factory
  enterprise from-engagement <id>     Create product from handoff
  enterprise kpis                     Business KPI snapshot
  enterprise campaign [name]          Run marketing intelligence pipeline
  handoff <engagementId>              Alias: factory handoff inspect
  from-engagement <id>                Alias: create product from engagement

Legacy / platform:
  init [dir]                  Scaffold workspace
  plan [dna]                  Show Core builder pipeline
  runtime status              Core runtime status
  skill list|install          First-party skills
  help
`.trim();

const state = { lastBuild: null, lastProject: null };

export async function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log(HELP);
    return 0;
  }

  const productCmds = new Set([
    'create', 'build', 'regenerate', 'validate', 'deploy', 'status', 'metrics',
    'doctor', 'list', 'clone', 'archive', 'catalog', 'reference', 'get',
    'handoff', 'from-engagement', 'gate',
  ]);

  if (productCmds.has(cmd)) {
    return runProductCli([cmd, ...rest]);
  }

  switch (cmd) {
    case 'enterprise':
      return cmdEnterprise(rest);
    case 'init':
      return cmdInit(rest[0] ?? '.');
    case 'plan':
      return cmdPlan(rest[0]);
    case 'runtime':
      if (rest[0] === 'status') return cmdRuntimeStatus();
      throw new Error('usage: grabber runtime status');
    case 'skill':
      if (rest[0] === 'install') return cmdSkillInstall(rest[1]);
      if (rest[0] === 'list') return cmdSkillList();
      throw new Error('usage: grabber skill install|list');
    case 'plugin':
      if (rest[0] === 'install') return cmdPluginInstall(rest[1]);
      throw new Error('usage: grabber plugin install <manifest-path>');
    case 'search':
      return cmdSearch(rest.join(' '));
    case 'graph':
      if (rest[0] === 'impact') return cmdGraphImpact(rest[1]);
      throw new Error('usage: grabber graph impact <projectId>');
    default:
      throw new Error(`unknown command "${cmd}"\n\n${HELP}`);
  }
}

async function loadEnterprise() {
  const modPath = join(ROOT, 'packages/enterprise/src/index.js');
  if (!existsSync(modPath)) throw new Error('@grabber/enterprise missing');
  if (!process.env.GRABBER_ENTERPRISE_DIR) {
    process.env.GRABBER_ENTERPRISE_DIR = join(ROOT, '.grabber/enterprise');
  }
  return import(pathToFileURL(modPath).href);
}

async function cmdEnterprise(args) {
  const [sub, ...rest] = args;
  if (!sub || sub === 'help') {
    console.log(JSON.stringify({
      ok: true,
      commands: [
        'enterprise seed [name] [industry]',
        'enterprise list',
        'enterprise handoff <engagementId>',
        'enterprise from-engagement <id>',
        'enterprise kpis',
        'enterprise campaign [name] [industry]',
      ],
    }, null, 2));
    return 0;
  }

  const api = await loadEnterprise();

  if (sub === 'seed') {
    const name = rest[0] || 'Harbor Hotel';
    const industry = rest[1] || 'hospitality';
    const result = api.milestone1Sync(name, industry, ROOT);
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return 0;
  }

  if (sub === 'list') {
    const engagements = api.listEngagements(ROOT);
    console.log(JSON.stringify({ ok: true, engagements }, null, 2));
    return 0;
  }

  if (sub === 'handoff') {
    const id = rest[0];
    if (!id) throw new Error('usage: grabber enterprise handoff <engagementId>');
    const handoff = api.getFactoryHandoff(id, ROOT);
    console.log(JSON.stringify({ ok: true, handoff }, null, 2));
    return 0;
  }

  if (sub === 'from-engagement') {
    // Delegate product creation to factory product-cli
    return runProductCli(['from-engagement', rest[0]]);
  }

  if (sub === 'kpis') {
    const kpis = api.getBusinessKpis(ROOT);
    console.log(JSON.stringify({ ok: true, kpis }, null, 2));
    return 0;
  }

  if (sub === 'campaign') {
    let c = api.createCampaign(
      { name: rest[0] || 'Launch', industry: rest[1] || 'general' },
      ROOT,
    );
    c = api.runTrendDiscovery(c.id, ROOT);
    c = api.runCompetitorScan(c.id, ROOT);
    c = api.runKeywordResearch(c.id, ROOT);
    c = api.planContent(c.id, ROOT);
    c = api.createContent(c.id, ROOT);
    for (const item of c.content_items) {
      c = api.approveContent(c.id, item.id, 'cli', ROOT);
    }
    c = api.publishApproved(c.id, ROOT);
    console.log(JSON.stringify({ ok: true, campaign: c }, null, 2));
    return 0;
  }

  if (sub === 'consult') {
    // Demo consulting pipeline — business story → package (not factory)
    const name = rest[0] || 'Lanka Textiles';
    const story =
      rest.slice(1).join(' ') ||
      'I own a textile raw material wholesale business in Sri Lanka. I want to modernize operations.';
    const answers = {
      products: 'Cotton yarn, polyester, greige fabric',
      source: 'Import and local supply',
      locations: '2 warehouses',
      channel: 'Wholesale B2B',
      volume: '400 orders/month',
      current_systems: 'Excel + accounting software',
      inventory_today: 'Weekly counts, frequent mismatches',
      receiving: 'Manual receive, visual QC',
      credit: '30-60 day credit, soft limits',
      approvals: 'Owner approves large POs',
      pain: 'Stock errors, slow invoicing, weak credit control',
      success: 'Live stock, barcode receiving, credit holds',
      units: 'Kg and meters; some rolls',
    };
    const result = await api.runConsultingPipeline({ name, story }, answers, ROOT);
    console.log(
      JSON.stringify(
        {
          ok: true,
          positioning: 'ai_consulting_firm',
          blocked: result.blocked,
          manufacturing_unlocked: result.package?.delivery?.manufacturing_unlocked,
          stage: result.engagement?.consulting?.stage,
          confidence: result.engagement?.consulting?.confidence,
          confidence_dimensions: result.engagement?.consulting?.confidence_dimensions,
          maturity: result.package?.business_maturity?.narrative,
          roi: result.package?.roi?.narrative,
          llm: result.llm || result.engagement?.consulting?.llm,
          executive_html_chars: result.executive_html?.length || 0,
          essential: result.package?.functional?.requirements
            ?.filter((r) => r.class === 'essential')
            .map((r) => r.capability),
          recommended: result.package?.functional?.requirements
            ?.filter((r) => r.class === 'recommended')
            .map((r) => r.capability)
            .slice(0, 8),
          commercial_total: result.package?.commercial?.pricing?.total,
          legal_boundary: result.engagement?.consulting?.legal_boundary,
        },
        null,
        2,
      ),
    );
    return result.blocked ? 1 : 0;
  }

  throw new Error(`unknown enterprise subcommand "${sub}"`);
}

function runProductCli(args) {
  const script = join(SAAS, 'scripts/product-cli.ts');
  if (!existsSync(script)) {
    console.error(JSON.stringify({ ok: false, error: 'product-cli missing' }));
    return 1;
  }
  // Prefer local tsx from saas-starter node_modules
  const tsxCli = join(SAAS, 'node_modules/tsx/dist/cli.mjs');
  const nodeArgs = existsSync(tsxCli)
    ? [tsxCli, script, ...args]
    : ['--import', 'tsx', script, ...args];

  const r = spawnSync(process.execPath, nodeArgs, {
    cwd: SAAS,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });
  // Use console.log so test harnesses can capture output
  if (r.stdout?.trim()) {
    for (const line of r.stdout.replace(/\r\n/g, '\n').split('\n')) {
      if (line.length) console.log(line);
    }
  }
  if (r.stderr?.trim()) {
    for (const line of r.stderr.replace(/\r\n/g, '\n').split('\n')) {
      if (line.length) console.error(line);
    }
  }
  return r.status ?? 1;
}

function cmdInit(dir) {
  const target = resolve(process.cwd(), dir);
  mkdirSync(join(target, 'projects'), { recursive: true });
  mkdirSync(join(target, 'extensions'), { recursive: true });
  if (!existsSync(join(target, 'grabber.json'))) {
    writeFileSync(join(target, 'grabber.json'), `${JSON.stringify({
      name: 'grabber-workspace',
      version: '2.0.0',
      core: '1.8.0',
      factory: '2.0.0',
      tracks: { platform: 'A-frozen', product: 'B' },
      extensions: [],
    }, null, 2)}\n`);
  }
  console.log(JSON.stringify({ ok: true, path: target, version: '2.0.0' }, null, 2));
  return 0;
}

function cmdPlan(arg) {
  const factory = createProductFactory();
  const dnaPath = resolveDnaPath(arg);
  const dna = JSON.parse(readFileSync(dnaPath, 'utf8'));
  // Core factory expects { project: ... } envelope
  const plan = factory.plan(dna.project ? dna : { project: dna });
  console.log(JSON.stringify({ ok: true, source: dnaPath, ...plan }, null, 2));
  return 0;
}

function resolveDnaPath(arg) {
  if (!arg) {
    return join(SAAS, 'reference-projects/saas/project-dna.json');
  }
  const candidates = [
    resolve(process.cwd(), arg),
    join(SAAS, 'reference-projects', arg, 'project-dna.json'),
    join(ROOT, 'templates/products', arg, 'project-dna.json'),
    join(process.cwd(), 'projects', arg, 'project-dna.json'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(`cannot resolve DNA: ${arg}`);
}

function cmdRuntimeStatus() {
  const client = createGrabberClient();
  console.log(JSON.stringify(client.runtime.status(), null, 2));
  return 0;
}

function cmdSearch(query) {
  if (!query) throw new Error('usage: grabber search <query>');
  const client = createGrabberClient();
  console.log(JSON.stringify(client.search.ask(query, { q: query }), null, 2));
  return 0;
}

function cmdGraphImpact(projectId) {
  if (!projectId) throw new Error('usage: grabber graph impact <projectId>');
  const client = createGrabberClient();
  const impact = client.graph.impact({
    projectId,
    seeds: [`dna:${projectId}`],
    markStale: true,
  });
  console.log(JSON.stringify(impact, null, 2));
  return 0;
}

async function cmdPluginInstall(path) {
  if (!path) throw new Error('usage: grabber plugin install <manifest-path>');
  const client = createGrabberClient();
  const runtime = new ExtensionRuntime({ bus: client.runtime.bus, sdk: client });
  const manifest = JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8'));
  const installed = await runtime.install(manifest, {
    actions: { ping: async () => ({ ok: true, id: manifest.id }) },
  });
  console.log(JSON.stringify({ ok: true, extension: installed }, null, 2));
  return 0;
}

async function cmdSkillInstall(idOrPath) {
  if (!idOrPath) throw new Error('usage: grabber skill install <id|path>');
  const client = createGrabberClient();
  const runtime = new ExtensionRuntime({ bus: client.runtime.bus, sdk: client });
  const catalog = JSON.parse(readFileSync(join(ROOT, 'skills/catalog.json'), 'utf8'));
  let skillDir;
  const byId = catalog.skills.find((s) => s.id === idOrPath);
  if (byId) skillDir = join(ROOT, 'skills', byId.path);
  else skillDir = resolve(process.cwd(), idOrPath);
  const manifest = JSON.parse(readFileSync(join(skillDir, 'manifest.json'), 'utf8'));
  const mod = await import(pathToFileURL(join(skillDir, 'index.js')).href);
  const { module } = defineSkill({
    ...manifest,
    actions: mod.actions,
    initialize: mod.initialize,
  });
  const installed = await runtime.install(manifest, module);
  console.log(JSON.stringify({ ok: true, skill: installed }, null, 2));
  return 0;
}

function cmdSkillList() {
  const catalog = JSON.parse(readFileSync(join(ROOT, 'skills/catalog.json'), 'utf8'));
  console.log(JSON.stringify(catalog.skills.map((s) => ({
    id: s.id, category: s.category, path: s.path,
  })), null, 2));
  return 0;
}

export const _internal = { ROOT, SAAS, HELP, state };
