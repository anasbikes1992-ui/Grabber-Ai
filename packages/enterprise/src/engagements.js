import { save, get, list } from './store.js';
import { GOVERNANCE_STAGES, ENGAGEMENT_STATUSES } from './types.js';
import { buildDiscoveryScript, loadPlaybook } from './playbooks.js';
import { generateCommercialPackage } from './commercial.js';
import { createHash } from 'node:crypto';

/**
 * Create engagement (lead) — Business OS entry point.
 */
export function createEngagement(input, cwd) {
  const name = String(input.name || input.client_name || '').trim();
  if (!name) throw new Error('client name required');
  const industry = String(input.industry || 'saas').toLowerCase();
  const record = {
    id: undefined,
    type: 'engagement',
    client_name: name,
    contact_email: input.contact_email || '',
    industry,
    status: 'lead',
    governance_stage: 'discovery',
    governance_history: [],
    discovery: {
      script: buildDiscoveryScript(industry, name, cwd),
      answers: {},
      completed: false,
    },
    analysis: null,
    solution: null,
    commercial: null,
    risks: [],
    approvals: {
      internal: null,
      client: null,
      deposit: null,
    },
    project_dna: null,
    factory_eligible: false,
    deliverables: {},
    notes: input.notes || '',
  };
  return save('engagements', record, cwd);
}

export function getEngagement(id, cwd) {
  const e = get('engagements', id, cwd);
  if (!e) throw new Error(`engagement ${id} not found`);
  return e;
}

export function listEngagements(cwd) {
  return list('engagements', cwd);
}

/**
 * AI-style consultation: deterministic business analysis from answers + playbook.
 */
export function runBusinessAnalysis(engagementId, answers, cwd) {
  const e = getEngagement(engagementId, cwd);
  e.discovery.answers = { ...e.discovery.answers, ...answers };
  e.discovery.completed = true;
  e.status = 'analysis';
  e.governance_stage = 'business_analysis';

  const pb = loadPlaybook(e.industry, cwd);
  const answerText = Object.values(e.discovery.answers).join(' ');
  const painPoints = extractList(answerText, ['pain', 'problem', 'struggle', 'manual', 'slow']);
  const opportunities = [
    'Automate core workflow with Product Factory modules',
    'Reduce manual ops via integrations',
    ...(pb.upsells || []).slice(0, 3).map((u) => `Upsell: ${u}`),
  ];

  e.analysis = {
    at: new Date().toISOString(),
    executive_summary: `${e.client_name} (${e.industry}): opportunity to deliver a production application via Grabber Product Factory using industry playbook modules.`,
    pain_points: painPoints.length
      ? painPoints
      : ['Manual processes', 'Limited visibility', 'Slow delivery of digital tools'],
    opportunities,
    processes: inferProcesses(e.industry),
    competitors: [
      'Generic agencies with high custom cost',
      'Off-the-shelf SaaS with poor fit',
    ],
    roi: {
      estimated_hours_saved_per_month: 40 + (pb.modules?.required?.length || 0) * 5,
      estimated_payback_months: 3,
      confidence: e.discovery.answers && Object.keys(e.discovery.answers).length >= 3 ? 0.75 : 0.55,
    },
  };

  pushGov(e, 'business_analysis', 'analysis_complete');
  return save('engagements', e, cwd);
}

/**
 * Solution design + draft DNA for factory (not yet eligible).
 */
export function designSolution(engagementId, overrides = {}, cwd) {
  const e = getEngagement(engagementId, cwd);
  if (!e.analysis) throw new Error('run business analysis first');
  const pb = loadPlaybook(e.industry, cwd);
  const modules = unique([
    ...(pb.modules?.required || []),
    ...(overrides.modules || []),
  ]);
  const integrations = unique([
    ...(pb.integrations?.required || ['supabase', 'github', 'vercel']),
    ...(overrides.integrations || []),
  ]);
  const blueprint =
    overrides.blueprint ||
    pb.modules?.blueprint ||
    inferBlueprint(e.industry);

  e.solution = {
    at: new Date().toISOString(),
    blueprint,
    modules,
    integrations,
    architecture: 'modular-monolith',
    stack: 'Next.js + Supabase',
    timeline_weeks: Math.max(4, Math.ceil(modules.length / 2)),
  };

  e.project_dna = {
    product: {
      type: blueprint,
      name: slug(`${e.client_name}-${blueprint}`),
      blueprint,
      version: '1.0.0',
    },
    project: {
      name: slug(`${e.client_name}-${blueprint}`),
      type: blueprint,
      industry: e.industry,
      goals: e.analysis.opportunities.slice(0, 3),
      users: [
        { role: 'admin', goals: ['configure', 'report'] },
        { role: 'user', goals: ['complete primary workflow'] },
      ],
      critical_flows: inferProcesses(e.industry).slice(0, 5),
      standards_version: 'stds-1.0.0',
    },
    modules,
    integrations,
    deployment: { provider: 'vercel' },
    quality: {
      security: ['healthcare', 'finance', 'legal'].includes(e.industry)
        ? 'elevated'
        : 'high',
      testing: 'required',
    },
    governance: {
      engagement_id: e.id,
      stage: e.governance_stage,
    },
  };

  e.risks = (pb.risks || []).map((r) => ({
    id: r.id || randomId(),
    severity: r.severity || 'medium',
    description: r.description || String(r),
    mitigation: r.mitigation || 'Track in SOW and UAT',
  }));

  e.status = 'commercial';
  e.governance_stage = 'solution_design';
  pushGov(e, 'solution_design', 'dna_drafted');
  return save('engagements', e, cwd);
}

/**
 * Advance governance stage with actor sign-off.
 */
export function advanceGovernance(engagementId, { stage, actor, notes }, cwd) {
  const e = getEngagement(engagementId, cwd);
  const idx = GOVERNANCE_STAGES.indexOf(stage);
  if (idx < 0) throw new Error(`unknown stage ${stage}`);
  const currentIdx = GOVERNANCE_STAGES.indexOf(e.governance_stage);
  if (idx < currentIdx) throw new Error('cannot move governance backwards');

  e.governance_stage = stage;
  pushGov(e, stage, notes || 'approved', actor);

  if (stage === 'internal_approval') {
    e.approvals.internal = { actor, at: new Date().toISOString() };
  }
  if (stage === 'client_approval') {
    e.approvals.client = { actor, at: new Date().toISOString() };
    e.status = 'approved';
  }
  if (stage === 'deposit_received') {
    e.approvals.deposit = {
      actor,
      at: new Date().toISOString(),
      amount: notes || 'received',
    };
  }
  if (stage === 'factory_ready') {
    assertFactoryEligible(e);
    e.factory_eligible = true;
    e.status = 'in_factory';
  }

  return save('engagements', e, cwd);
}

/**
 * Run commercial package generation (Milestone 3).
 */
export function runCommercialAutomation(engagementId, cwd) {
  const e = getEngagement(engagementId, cwd);
  if (!e.solution || !e.project_dna) {
    throw new Error('design solution before commercial automation');
  }
  e.commercial = generateCommercialPackage(e);
  e.deliverables = e.commercial.deliverables;
  e.governance_stage = 'commercial_review';
  pushGov(e, 'commercial_review', 'package_generated');
  return save('engagements', e, cwd);
}

/**
 * Factory gate: only return DNA if fully approved + deposit.
 */
export function getFactoryHandoff(engagementId, cwd) {
  const e = getEngagement(engagementId, cwd);
  assertFactoryEligible(e);
  const fingerprint = createHash('sha256')
    .update(JSON.stringify(e.project_dna))
    .digest('hex')
    .slice(0, 16);
  return {
    ok: true,
    engagement_id: e.id,
    client_name: e.client_name,
    governance_stage: e.governance_stage,
    factory_eligible: true,
    project_dna: e.project_dna,
    fingerprint,
    commercial_refs: {
      proposal_id: e.commercial?.ids?.proposal,
      sow_id: e.commercial?.ids?.sow,
    },
    approvals: e.approvals,
  };
}

function assertFactoryEligible(e) {
  if (!e.approvals?.internal) {
    throw new Error('internal approval required before factory');
  }
  if (!e.approvals?.client) {
    throw new Error('client approval required before factory');
  }
  if (!e.approvals?.deposit) {
    throw new Error('deposit must be received before factory');
  }
  if (!e.project_dna) {
    throw new Error('project DNA required');
  }
  if (!e.commercial) {
    throw new Error('commercial package required');
  }
}

function pushGov(e, stage, note, actor = 'system') {
  e.governance_history = e.governance_history || [];
  e.governance_history.push({
    stage,
    note,
    actor,
    at: new Date().toISOString(),
  });
}

function extractList(text, keywords) {
  const lower = text.toLowerCase();
  const hits = [];
  for (const k of keywords) {
    if (lower.includes(k)) hits.push(`Mentioned: ${k}`);
  }
  return hits;
}

function inferProcesses(industry) {
  const map = {
    hospitality: ['search', 'book', 'pay', 'notify', 'review'],
    restaurants: ['reserve', 'order', 'pay', 'notify'],
    retail: ['browse', 'cart', 'checkout', 'fulfill'],
    healthcare: ['intake', 'schedule', 'record', 'bill'],
    education: ['enroll', 'learn', 'assess', 'certify'],
    saas: ['signup', 'invite', 'configure', 'upgrade'],
  };
  return map[industry] || ['discover', 'transact', 'support'];
}

function inferBlueprint(industry) {
  const map = {
    hospitality: 'booking',
    restaurants: 'booking',
    retail: 'marketplace',
    saas: 'saas',
    healthcare: 'saas',
    education: 'saas',
    finance: 'saas',
    legal: 'crm',
    manufacturing: 'inventory',
    logistics: 'inventory',
    construction: 'crm',
    'real-estate': 'crm',
  };
  return map[industry] || 'saas';
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function unique(xs) {
  return [...new Set(xs.filter(Boolean))];
}

function randomId() {
  return Math.random().toString(36).slice(2, 8);
}
