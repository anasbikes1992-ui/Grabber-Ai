import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  inferIndustry,
  startConsultation,
  answerDiscovery,
  runConsultingPipeline,
  DISCOVERY_CONFIDENCE_THRESHOLD,
  CAPABILITY_CLASS,
  JARVIS_CONSULTANT_CHARTER,
  PRODUCT_TAGLINES,
  EXPERT_PERSONAS,
  navigateFromIndustry,
} from '../src/index.js';

const ROOT = join(process.cwd(), '../..');

function freshDir() {
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), 'consult-'));
  return ROOT;
}

test('infers wholesale-distribution from textile story', () => {
  const ind = inferIndustry(
    'I own a textile raw material wholesale business in Sri Lanka',
  );
  assert.equal(ind, 'wholesale-distribution');
});

test('discovery blocks intelligence until confidence threshold', async () => {
  const cwd = freshDir();
  const e = startConsultation(
    {
      story:
        'I own a textile raw material wholesale business in Sri Lanka. I want to modernize.',
      name: 'Lanka Textiles',
    },
    cwd,
  );
  assert.ok(e.consulting.charter.includes('Chief Business Consultant'));
  assert.equal(e.consulting.stage, 'discovery');

  const thin = await answerDiscovery(e.id, { products: 'yarn' }, cwd);
  assert.equal(thin.ready, false);
  assert.ok(thin.confidence < DISCOVERY_CONFIDENCE_THRESHOLD);
  assert.ok(thin.next_questions.length >= 1);
});

test('full consulting pipeline produces package without factory unlock', async () => {
  const cwd = freshDir();
  const answers = {
    products: 'Cotton yarn, polyester, greige fabric',
    source: 'Import containers from India and China; some local dye houses',
    locations: '2 warehouses in Colombo area, no retail shops',
    channel: 'Wholesale B2B only',
    volume: 'About 400 orders per month',
    current_systems: 'Excel + QuickBooks; paper GRNs',
    inventory_today: 'Weekly stock counts; frequent mismatches',
    receiving: 'Truck unload, visual QC, no barcodes, damage notes in WhatsApp',
    credit: '30–60 day credit for regulars; no hard limits enforced',
    approvals: 'Owner approves all POs above LKR 500k',
    pain: 'Stock errors, slow invoicing, no credit control, import cost unclear',
    success: 'Live stock, barcode receiving, credit holds, clear landed cost',
    units: 'Kg and fabric meters; some roll inventory',
  };

  const result = await runConsultingPipeline(
    {
      name: 'Lanka Textiles',
      story:
        'Textile raw material wholesale in Sri Lanka. Modernize operations. Act as consultant not code monkey.',
    },
    answers,
    cwd,
  );

  assert.equal(result.blocked, null);
  assert.ok(result.engagement.consulting.confidence >= DISCOVERY_CONFIDENCE_THRESHOLD);
  assert.ok(result.package);
  assert.ok(result.package.business.executive_summary);
  assert.ok(result.package.functional.requirements.length >= 4);
  assert.ok(result.package.commercial.pricing.total > 0);
  assert.ok(result.package.legal.sow);
  assert.equal(result.package.delivery.manufacturing_unlocked, false);
  assert.equal(result.engagement.factory_eligible, false);
  assert.ok(result.package.executive_presentation);
  assert.ok(result.executive_html?.includes('Executive'));
  assert.ok(result.package.business_maturity?.current?.level >= 1);
  assert.ok(result.package.roi?.hours_saved_per_month > 0);
  assert.ok(result.package.confidence?.overall >= DISCOVERY_CONFIDENCE_THRESHOLD);
  assert.ok(result.engagement.consulting.knowledge_graph?.node_count > 0);

  const recs = result.engagement.consulting.gap_analysis.recommendations;
  assert.ok(result.engagement.consulting.gap_analysis.decision_intelligence);
  assert.ok(recs.some((r) => r.classification === CAPABILITY_CLASS.ESSENTIAL));
  assert.ok(recs.some((r) => (r.id || r.name) === 'barcode_receiving' || r.recommendation === 'Barcode Receiving'));
  const barcode = recs.find(
    (r) => r.id === 'barcode_receiving' || r.recommendation === 'Barcode Receiving',
  );
  assert.ok(barcode.sources?.length >= 2);
  assert.ok(barcode.confidence >= 0.7);
  assert.ok(barcode.explainable?.why);
  assert.ok(barcode.if_excluded);
  assert.ok(result.package.functional.decision_briefs?.length >= 1);
  assert.ok(result.engagement.consulting.benchmark.systems.length >= 2);
  assert.ok(
    result.engagement.consulting.multi_agent_review.client_visible.length >= 1,
  );
  assert.ok(
    result.engagement.consulting.multi_agent_review.model ===
      'professional_departments',
  );
  assert.ok(JARVIS_CONSULTANT_CHARTER.includes('consulting firm'));
  assert.ok(PRODUCT_TAGLINES.simple.includes('businesses'));
  assert.ok(EXPERT_PERSONAS.length >= 10);
});

test('knowledge graph navigates textile wholesale', () => {
  const nav = navigateFromIndustry('wholesale-distribution', ROOT);
  assert.ok(nav.node_count >= 10);
  assert.ok(nav.capabilities.length >= 3);
  assert.ok(nav.path_preview?.length || nav.layers.length >= 1);
});
