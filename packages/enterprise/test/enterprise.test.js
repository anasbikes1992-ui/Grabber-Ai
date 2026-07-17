import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createEngagement,
  runBusinessAnalysis,
  designSolution,
  runCommercialAutomation,
  advanceGovernance,
  getFactoryHandoff,
  milestone1Sync,
  listIndustries,
  loadPlaybook,
  getOpsSnapshot,
  createTicket,
  createDeliveryRecord,
  markDeployed,
  activateMaintenance,
  createCampaign,
  runTrendDiscovery,
  runCompetitorScan,
  runKeywordResearch,
  planContent,
  createContent,
  approveContent,
  publishApproved,
  getClientPortalView,
  clientCreateTicket,
  getBusinessKpis,
  COMMERCIAL_DELIVERABLES,
} from '../src/index.js';

function cwd() {
  const dir = mkdtempSync(join(tmpdir(), 'grabber-ent-'));
  process.env.GRABBER_ENTERPRISE_DIR = dir;
  // monorepo root for playbooks
  return join(process.cwd(), '../..');
}

test('playbooks list industries and load hospitality', () => {
  const root = join(process.cwd(), '../..');
  const industries = listIndustries(root);
  assert.ok(industries.some((i) => i.id === 'hospitality'));
  const pb = loadPlaybook('hospitality', root);
  assert.ok(pb.questions.length >= 3);
  assert.ok((pb.modules.required || []).includes('booking'));
});

test('milestone 1 full path ends factory-ready with DNA', () => {
  const root = join(process.cwd(), '../..');
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), 'm1-'));
  const { engagement, handoff } = milestone1Sync(
    'Harbor Hotel',
    'hospitality',
    root,
  );
  assert.equal(engagement.factory_eligible, true);
  assert.equal(engagement.governance_stage, 'factory_ready');
  assert.ok(handoff.project_dna.modules.includes('booking'));
  assert.ok(handoff.approvals.deposit);
  assert.ok(engagement.commercial.pricing.total > 0);
  assert.ok(
    Object.keys(engagement.deliverables).length >=
      COMMERCIAL_DELIVERABLES.length,
  );
});

test('factory blocked without deposit', () => {
  const root = join(process.cwd(), '../..');
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), 'block-'));
  let e = createEngagement({ name: 'No Deposit Co', industry: 'saas' }, root);
  e = runBusinessAnalysis(e.id, { a: 'saas product needs billing' }, root);
  e = designSolution(e.id, {}, root);
  e = runCommercialAutomation(e.id, root);
  e = advanceGovernance(
    e.id,
    { stage: 'internal_approval', actor: 'cto' },
    root,
  );
  e = advanceGovernance(
    e.id,
    { stage: 'client_approval', actor: 'client' },
    root,
  );
  assert.throws(() => getFactoryHandoff(e.id, root), /deposit/i);
});

test('ops snapshot and tickets', () => {
  const root = join(process.cwd(), '../..');
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), 'ops-'));
  createEngagement({ name: 'Ops Client', industry: 'retail' }, root);
  createTicket({ client_name: 'Ops Client', subject: 'Help' }, root);
  const snap = getOpsSnapshot(root);
  assert.ok(snap.leads >= 0);
  assert.ok(typeof snap.finance.gross_margin_pct === 'number');
  assert.ok(snap.open_tickets >= 1);
});

test('delivery and maintenance lifecycle', () => {
  const root = join(process.cwd(), '../..');
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), 'del-'));
  const { engagement } = milestone1Sync('Stay Inn', 'hospitality', root);
  let d = createDeliveryRecord(engagement.id, {}, root);
  d = markDeployed(d.id, 'https://stay-inn.vercel.app', root);
  assert.equal(d.status, 'deployed');
  d = activateMaintenance(d.id, root);
  assert.equal(d.maintenance.active, true);
});

test('marketing intelligence full pipeline', () => {
  const root = join(process.cwd(), '../..');
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), 'mkt-'));
  let c = createCampaign({ name: 'Launch', industry: 'hospitality' }, root);
  c = runTrendDiscovery(c.id, root);
  c = runCompetitorScan(c.id, root);
  c = runKeywordResearch(c.id, root);
  c = planContent(c.id, root);
  c = createContent(c.id, root);
  for (const item of c.content_items) {
    c = approveContent(c.id, item.id, 'marketer', root);
  }
  c = publishApproved(c.id, root);
  assert.equal(c.stage, 'analytics');
  assert.ok(c.publications.length >= 1);
  assert.ok(c.analytics.reach > 0);
});

test('client portal view and ticket', () => {
  const root = join(process.cwd(), '../..');
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), 'portal-'));
  const { engagement } = milestone1Sync('Portal Hotel', 'hospitality', root);
  const view = getClientPortalView('Portal Hotel', root);
  assert.equal(view.ok, true);
  assert.ok(view.proposals.length >= 1);
  assert.ok(view.documents.length >= 10);
  const t = clientCreateTicket('Portal Hotel', 'Question', 'Need invoice', root);
  assert.equal(t.status, 'open');
  assert.equal(engagement.client_name, 'Portal Hotel');
});

test('business KPIs aggregate', () => {
  const root = join(process.cwd(), '../..');
  process.env.GRABBER_ENTERPRISE_DIR = mkdtempSync(join(tmpdir(), 'kpi-'));
  milestone1Sync('KPI Co', 'saas', root);
  const k = getBusinessKpis(root);
  assert.ok(k.sales.proposals >= 1);
  assert.ok(k.factory.eligible >= 1);
  assert.ok(k.finance.revenue_booked > 0);
});
