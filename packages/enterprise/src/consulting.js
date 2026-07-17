/**
 * Jarvis Chief Business Consultant engine (Track B).
 * Product model: AI Consulting Firm — not an AI code generator.
 * Factory is internal execution after governance; client never "uses a factory."
 * @see docs/PRODUCT-MODEL.md
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { save, get } from './store.js';
import { loadPlaybook, buildDiscoveryScript } from './playbooks.js';
import { generateCommercialPackage } from './commercial.js';
import { graphRecommendations, navigateFromIndustry } from './knowledge-graph.js';
import {
  enrichRecommendations,
  explainRecommendation,
} from './decision-intelligence.js';
import {
  llmDiscoveryTurn,
  llmGapEnrichment,
  llmDepartmentReview,
  isLlmAvailable,
} from './consulting-llm.js';
import { renderExecutiveHtml } from './executive-package.js';
import { llmStatus } from './llm.js';
import {
  DISCOVERY_CONFIDENCE_THRESHOLD,
  CAPABILITY_CLASS,
  EXPERT_PERSONAS,
  PRODUCT_TAGLINES,
  JARVIS_CONSULTANT_CHARTER,
} from './consulting-constants.js';

export {
  DISCOVERY_CONFIDENCE_THRESHOLD,
  CAPABILITY_CLASS,
  EXPERT_PERSONAS,
  PRODUCT_TAGLINES,
  JARVIS_CONSULTANT_CHARTER,
};

export const CONSULTING_STAGES = Object.freeze([
  'intake',
  'discovery',
  'industry_intelligence',
  'benchmark',
  'gap_analysis',
  'multi_agent_review',
  'solution_package',
  'awaiting_governance',
]);

const LEGAL_BOUNDARY =
  'Learn patterns and outcomes only. Never copy proprietary code, pixel UIs, branded assets, or confidential material.';

function knowledgeRoot(cwd = process.cwd()) {
  const candidates = [
    join(cwd, 'knowledge'),
    join(cwd, '..', '..', 'knowledge'),
    join(cwd, '..', 'knowledge'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0];
}

function readJsonSafe(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function readMdSafe(path) {
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8');
}

function loadEngagement(id, cwd) {
  const e = get('engagements', id, cwd);
  if (!e) throw new Error(`engagement ${id} not found`);
  return e;
}

function saveEngagement(e, cwd) {
  return save('engagements', e, cwd);
}

/**
 * Infer industry slug from free-text business story.
 */
export function inferIndustry(text = '') {
  const t = String(text).toLowerCase();
  const rules = [
    [/textile|fabric|yarn|garment|apparel|raw material/, 'wholesale-distribution'],
    [/hotel|hospitality|resort|guest/, 'hospitality'],
    [/restaurant|cafe|pos|kitchen/, 'restaurants'],
    [/clinic|hospital|patient|medical/, 'healthcare'],
    [/school|university|student|education/, 'education'],
    [/warehouse|logistics|fleet|freight/, 'logistics'],
    [/construction|contractor|site/, 'construction'],
    [/retail|e-?commerce|storefront/, 'retail'],
    [/marketplace|multi-?vendor/, 'retail'],
    [/crm|sales pipeline|leads/, 'saas'],
  ];
  for (const [re, ind] of rules) {
    if (re.test(t)) return ind;
  }
  return 'saas';
}

function extractBusinessName(story) {
  const m = String(story).match(
    /(?:own|run|operate)\s+(?:a\s+)?([A-Z][\w\s&'-]{2,40}?)(?:\s+in\s+|\s+business|\.|$)/,
  );
  return m ? m[1].trim() : null;
}

/**
 * Industry-aware interview queue (business profile + operations).
 */
export function buildInterviewQueue(industry, cwd) {
  const pb = loadPlaybook(industry, cwd);
  const pack = loadIndustryPack(industry, cwd);
  const base = [
    {
      id: 'products',
      section: 'business_profile',
      prompt: 'What products or services do you sell?',
      weight: 0.12,
      required: true,
    },
    {
      id: 'source',
      section: 'business_profile',
      prompt: 'Do you import, manufacture, or both? Where do goods come from?',
      weight: 0.1,
      required: true,
    },
    {
      id: 'locations',
      section: 'business_profile',
      prompt: 'How many warehouses, shops, or branches do you operate?',
      weight: 0.1,
      required: true,
    },
    {
      id: 'channel',
      section: 'business_profile',
      prompt: 'Are you wholesale, retail, B2B, B2C, or mixed?',
      weight: 0.08,
      required: true,
    },
    {
      id: 'volume',
      section: 'business_profile',
      prompt: 'Roughly how many orders or transactions per month?',
      weight: 0.08,
      required: true,
    },
    {
      id: 'current_systems',
      section: 'business_profile',
      prompt: 'What systems do you use today (Excel, accounting software, ERP, paper)?',
      weight: 0.1,
      required: true,
    },
    {
      id: 'inventory_today',
      section: 'operations',
      prompt: 'How do you currently manage inventory and stock accuracy?',
      weight: 0.1,
      required: true,
    },
    {
      id: 'receiving',
      section: 'operations',
      prompt: 'How do goods arrive? Any quality inspection, lot/batch, or damage handling?',
      weight: 0.08,
      required: true,
    },
    {
      id: 'credit',
      section: 'operations',
      prompt: 'Do customers buy on credit? How do you manage credit limits and collections?',
      weight: 0.08,
      required: false,
    },
    {
      id: 'approvals',
      section: 'operations',
      prompt: 'Who approves purchases and large discounts today?',
      weight: 0.06,
      required: false,
    },
    {
      id: 'pain',
      section: 'goals',
      prompt: 'What are the top 3 operational pains that cost you time or money?',
      weight: 0.1,
      required: true,
    },
    {
      id: 'success',
      section: 'goals',
      prompt: 'What does success look like in 90 days after go-live?',
      weight: 0.1,
      required: true,
    },
  ];

  const fromPlaybook = (pb.questions || []).map((q, i) => ({
    id: q.id || `pb-${i}`,
    section: q.section || 'playbook',
    prompt: q.prompt || String(q),
    weight: 0.05,
    required: Boolean(q.required),
  }));

  const fromPack = (pack.extra_questions || []).map((q, i) => ({
    id: q.id || `pack-${i}`,
    section: q.section || 'industry',
    prompt: q.prompt,
    weight: q.weight || 0.05,
    required: Boolean(q.required),
  }));

  const seen = new Set();
  const out = [];
  for (const q of [...base, ...fromPlaybook, ...fromPack]) {
    const key = String(q.prompt).toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

export function loadIndustryPack(industry, cwd) {
  const root = join(knowledgeRoot(cwd), 'industries', industry);
  if (!existsSync(root)) {
    if (industry === 'textile') return loadIndustryPack('wholesale-distribution', cwd);
    return {
      industry,
      status: 'planned',
      capabilities: defaultCapabilities(industry),
      extra_questions: [],
      body: '',
      benchmarks: defaultBenchmarkIds(industry),
    };
  }
  const extra = readJsonSafe(join(root, 'discovery-extra.json'), { questions: [] });
  const bench = readJsonSafe(join(root, 'benchmark-refs.json'), { systems: [] });
  return {
    industry,
    status: 'seed',
    body: readMdSafe(join(root, 'INDUSTRY.md')),
    capabilities: readJsonSafe(join(root, 'capabilities.json'), defaultCapabilities(industry)),
    extra_questions: extra.questions || [],
    benchmarks: bench.systems?.length ? bench.systems : defaultBenchmarkIds(industry),
  };
}

function defaultCapabilities(industry) {
  const map = {
    'wholesale-distribution': {
      essential: [
        'inventory',
        'purchasing',
        'sales_orders',
        'customers',
        'suppliers',
        'warehouses',
      ],
      recommended: [
        'barcode_receiving',
        'batch_lot_tracking',
        'customer_credit_limits',
        'landed_cost',
        'warehouse_transfers',
        'supplier_scorecards',
        'quality_inspection',
        'textile_roll_management',
      ],
      advanced: [
        'demand_forecasting',
        'dynamic_pricing',
        'multi_currency_purchasing',
        'container_shipment_tracking',
        'bi_dashboards',
      ],
    },
    hospitality: {
      essential: ['booking', 'calendar', 'payments', 'customers'],
      recommended: ['notifications', 'reviews', 'deposits'],
      advanced: ['channel_manager', 'loyalty'],
    },
  };
  return (
    map[industry] || {
      essential: ['authentication', 'rbac', 'core_workflow'],
      recommended: ['notifications', 'analytics'],
      advanced: ['ai_insights'],
    }
  );
}

function defaultBenchmarkIds(industry) {
  if (industry === 'wholesale-distribution' || industry === 'retail') {
    return ['erpnext', 'odoo', 'sap-b1', 'netsuite'];
  }
  return ['erpnext', 'odoo'];
}

function emptyConsulting(industry, story, cwd) {
  return {
    charter: JARVIS_CONSULTANT_CHARTER,
    positioning: 'ai_consulting_firm',
    stage: 'discovery',
    business_story: story || '',
    confidence: 0,
    confidence_dimensions: emptyConfidenceDimensions(),
    confidence_threshold: DISCOVERY_CONFIDENCE_THRESHOLD,
    interview: {
      asked: [],
      pending: buildInterviewQueue(industry, cwd),
      answers: {},
    },
    conversation_memory: story
      ? [
          {
            role: 'client',
            at: new Date().toISOString(),
            kind: 'business_story',
            text: story,
          },
        ]
      : [],
    llm: {
      used: false,
      model: null,
      turns: 0,
      cost_usd: 0,
      last_error: null,
      path: 'deterministic',
    },
    industry_intelligence: null,
    knowledge_graph: null,
    benchmark: null,
    gap_analysis: null,
    multi_agent_review: null,
    maturity: null,
    roi: null,
    executive_presentation: null,
    executive_html: null,
    solution_package: null,
    legal_boundary: LEGAL_BOUNDARY,
    ready_for_intelligence: false,
  };
}

function emptyConfidenceDimensions() {
  return {
    business_understanding: 0,
    requirements: 0,
    operations: 0,
    warehouse: 0,
    accounting: 0,
    reporting: 0,
    compliance: 0,
    overall: 0,
  };
}

/**
 * Multi-dimensional confidence (0–1). Overall must meet threshold to package.
 */
export function scoreConfidenceDimensions(consulting) {
  const answers = consulting.interview?.answers || {};
  const pending = consulting.interview?.pending || [];
  const a = (id) => String(answers[id] || '').trim();
  const richness = (id) => {
    const t = a(id);
    if (t.length < 3) return 0;
    if (t.length > 80) return 1;
    if (t.length > 30) return 0.75;
    return 0.5;
  };
  const avg = (ids) => {
    if (!ids.length) return 0;
    return ids.reduce((s, id) => s + richness(id), 0) / ids.length;
  };

  const dims = {
    business_understanding: avg(['products', 'source', 'channel', 'locations', 'volume']),
    requirements: avg(['pain', 'success', 'current_systems']),
    operations: avg(['inventory_today', 'receiving', 'approvals']),
    warehouse: Math.max(richness('receiving'), richness('locations'), richness('units')),
    accounting: Math.max(richness('credit'), richness('import'), 0.35),
    reporting: Math.max(richness('success'), richness('pain') * 0.8, 0.4),
    compliance: Math.max(richness('qc'), richness('receiving') * 0.6, 0.35),
    overall: 0,
  };

  // coverage of required questions
  const required = pending.filter((q) => q.required);
  const reqAnswered = required.filter((q) => a(q.id).length >= 3).length;
  const coverage = required.length ? reqAnswered / required.length : 1;
  const overallLegacy = scoreDiscoveryConfidence(consulting);
  const weighted =
    dims.business_understanding * 0.25 +
    dims.requirements * 0.2 +
    dims.operations * 0.2 +
    dims.warehouse * 0.1 +
    dims.accounting * 0.1 +
    dims.reporting * 0.08 +
    dims.compliance * 0.07;
  dims.overall = Math.min(
    0.99,
    Math.round((weighted * 0.5 + overallLegacy * 0.5) * coverage * 100) / 100,
  );

  // Complete, rich interviews meet the 90% package gate
  const keys = Object.keys(answers);
  const richCount = keys.filter((k) => String(answers[k]).trim().length >= 20).length;
  if (coverage >= 0.95 && richCount >= 8) {
    dims.overall = Math.max(dims.overall, 0.91);
  }
  if (coverage >= 1 && richCount >= 10 && overallLegacy >= 0.75) {
    dims.overall = Math.max(dims.overall, 0.93);
  }

  for (const k of Object.keys(dims)) {
    dims[k] = Math.min(0.99, Math.round(dims[k] * 100) / 100);
  }
  return dims;
}

/**
 * Business maturity 1–5 (current → recommended → after delivery).
 */
export function assessBusinessMaturity(answers = {}, industry) {
  const text = Object.values(answers).join(' ').toLowerCase();
  let current = 2;
  if (/excel|paper|whatsapp|manual/.test(text)) current = 2;
  if (/quickbooks|xero|tally|partial/.test(text)) current = 3;
  if (/erp|barcode|wms|integrated/.test(text)) current = 3;
  if (/automated|realtime|real-time|dashboard/.test(text) && /erp/.test(text)) {
    current = 4;
  }
  if (text.length < 40) current = 1;

  const recommended = Math.min(5, current + 2);
  const after_delivery = Math.min(5, recommended + (industry === 'wholesale-distribution' ? 0 : 0));
  // after ERP typically level 4–5
  const after = Math.max(recommended, 4);

  const labels = {
    1: 'Ad hoc / tribal knowledge',
    2: 'Spreadsheet-driven operations',
    3: 'Partial systems, fragmented processes',
    4: 'Integrated operational system',
    5: 'Optimized, measurable, continuously improved',
  };

  return {
    current: { level: current, label: labels[current] },
    recommended: { level: recommended, label: labels[recommended] },
    after_delivery: { level: after, label: labels[after] },
    narrative: `Current business maturity Level ${current} (${labels[current]}). Recommended target Level ${recommended}. After delivery: Level ${after}.`,
  };
}

/**
 * Outcome-oriented ROI estimate (deterministic heuristic).
 */
export function estimateConsultingRoi(answers = {}, recs = []) {
  const text = Object.values(answers).join(' ').toLowerCase();
  let hours = 25;
  if (/manual|excel|paper/.test(text)) hours += 20;
  if (/mismatch|error|slow/.test(text)) hours += 12;
  hours += Math.min(30, recs.filter((r) => r.class === CAPABILITY_CLASS.ESSENTIAL).length * 3);
  hours += Math.min(20, recs.filter((r) => r.class === CAPABILITY_CLASS.RECOMMENDED).length * 2);

  const error_reduction_pct = /error|mismatch|damage/.test(text) ? 0.85 : 0.55;
  const inventory_accuracy = /barcode|batch/.test(recs.map((r) => r.name).join(' '))
    ? 0.97
    : 0.9;
  const payback_months = hours >= 50 ? 9 : hours >= 35 ? 11 : 14;

  return {
    current_state: text.includes('manual') || text.includes('excel')
      ? 'Manual / spreadsheet-heavy operations'
      : 'Partially digitized operations',
    recommended_state: 'Automated sales, controlled inventory, credit discipline',
    hours_saved_per_month: hours,
    reduced_mistakes_pct: Math.round(error_reduction_pct * 100),
    inventory_accuracy_target_pct: Math.round(inventory_accuracy * 100),
    expected_roi_months: payback_months,
    narrative: `Estimated ${hours} hours/month saved; ~${Math.round(error_reduction_pct * 100)}% fewer operational mistakes; inventory accuracy target ~${Math.round(inventory_accuracy * 100)}%; expected payback ~${payback_months} months.`,
  };
}

export function buildExecutivePresentation(e) {
  const c = e.consulting;
  const recs = c.gap_analysis?.recommendations || [];
  return {
    title: `Executive briefing — ${e.client_name}`,
    sections: {
      executive_summary: e.analysis?.executive_summary,
      business_problems: e.analysis?.pain_points,
      current_workflow: e.analysis?.processes,
      pain_points: e.analysis?.pain_points,
      industry_benchmark: c.benchmark?.synthesis,
      recommended_future_state: c.gap_analysis?.future_state_summary,
      project_scope: recs
        .filter((r) => (r.classification || r.class) !== CAPABILITY_CLASS.ADVANCED)
        .map((r) => r.recommendation || r.id || r.name),
      investment: e.commercial?.pricing,
      timeline: e.commercial?.timeline,
      expected_roi: c.roi,
      business_maturity: c.maturity,
      risks: (e.risks || []).slice(0, 5),
      next_steps: [
        'Review executive recommendations with stakeholders',
        'Approve commercial package (proposal / SOW)',
        'Complete governance and deposit',
        'Delivery team begins implementation under governance',
      ],
    },
    confidence: c.confidence_dimensions,
    client_message:
      'You have been assigned a Grabber consulting team. Internal manufacturing begins only after approval and deposit.',
  };
}

/**
 * Start from a business story — not a software feature list.
 */
export function startConsultation(input, cwd) {
  const story = String(input.story || input.business_story || input.notes || '').trim();
  const name = String(
    input.name || input.client_name || extractBusinessName(story) || 'Client',
  ).trim();
  const industry = String(input.industry || inferIndustry(story)).toLowerCase();

  const record = {
    id: undefined,
    type: 'engagement',
    client_name: name,
    contact_email: input.contact_email || '',
    industry,
    status: 'discovery',
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
    approvals: { internal: null, client: null, deposit: null },
    project_dna: null,
    factory_eligible: false,
    deliverables: {},
    notes: story,
    consulting: emptyConsulting(industry, story, cwd),
  };
  return saveEngagement(record, cwd);
}

export function scoreDiscoveryConfidence(consulting) {
  const pending = consulting.interview?.pending || [];
  const answers = consulting.interview?.answers || {};
  if (!pending.length) return Object.keys(answers).length ? 0.85 : 0;

  let earned = 0;
  let total = 0;
  for (const q of pending) {
    const w = q.weight || 0.05;
    total += w;
    const a = answers[q.id];
    if (a != null && String(a).trim().length >= 3) {
      earned += w;
      if (String(a).trim().length > 40) earned += 0.01;
    }
  }
  const answered = Object.keys(answers).filter((k) => String(answers[k] || '').trim()).length;
  const minGate = answered >= 6 ? 1 : answered / 6;
  const score = total === 0 ? 0 : (earned / total) * minGate;
  return Math.min(0.99, Math.round(score * 100) / 100);
}

/**
 * Answer interview questions; recompute confidence; return next questions.
 * Uses LLM when available (verified); otherwise deterministic queue.
 */
export async function answerDiscovery(engagementId, answers, cwd) {
  const e = loadEngagement(engagementId, cwd);
  if (!e.consulting) {
    e.consulting = emptyConsulting(e.industry, e.notes, cwd);
  }
  const c = e.consulting;
  c.interview.answers = { ...c.interview.answers, ...answers };
  e.discovery.answers = { ...e.discovery.answers, ...answers };

  for (const id of Object.keys(answers || {})) {
    if (!c.interview.asked.includes(id)) c.interview.asked.push(id);
  }

  // Conversation memory (structured turns)
  c.conversation_memory = c.conversation_memory || [];
  for (const [id, text] of Object.entries(answers || {})) {
    if (String(text || '').trim()) {
      c.conversation_memory.push({
        role: 'client',
        at: new Date().toISOString(),
        kind: 'answer',
        question_id: id,
        text: String(text).slice(0, 4000),
      });
    }
  }

  const detDims = scoreConfidenceDimensions(c);
  c.confidence_dimensions = detDims;
  c.confidence = detDims.overall;
  c.stage = 'discovery';

  let next = c.interview.pending
    .filter(
      (q) =>
        c.interview.answers[q.id] == null ||
        String(c.interview.answers[q.id]).trim() === '',
    )
    .slice(0, 3);
  let message =
    'Overall confidence below 90% — continue interview. Do not design software yet.';
  let path = 'deterministic';

  if (isLlmAvailable()) {
    const pack = loadIndustryPack(e.industry, cwd);
    const llm = await llmDiscoveryTurn({
      clientName: e.client_name,
      industry: e.industry,
      story: c.business_story || e.notes,
      answers: c.interview.answers,
      asked: c.interview.asked,
      packSummary: pack.body?.slice(0, 1200) || '',
      deterministicOverall: detDims.overall,
    });

    if (llm.ok && !llm.fallback) {
      path = 'llm';
      c.llm = c.llm || { turns: 0, cost_usd: 0 };
      c.llm.used = true;
      c.llm.path = 'llm';
      c.llm.model = llm.meta?.model;
      c.llm.turns = (c.llm.turns || 0) + 1;
      c.llm.cost_usd =
        Math.round(((c.llm.cost_usd || 0) + (llm.meta?.cost_usd || 0)) * 1e6) /
        1e6;
      c.llm.last_error = null;

      // Blend confidence: verifier already capped LLM dims
      c.confidence_dimensions = blendDims(detDims, llm.confidence_dimensions);
      c.confidence = c.confidence_dimensions.overall;

      if (llm.next_questions?.length) {
        // Merge novel follow-ups into pending queue
        for (const q of llm.next_questions) {
          const exists = c.interview.pending.some(
            (p) => p.id === q.id || p.prompt === q.prompt,
          );
          if (!exists) c.interview.pending.push(q);
        }
        next = llm.next_questions;
      }

      if (llm.reasoning) {
        c.conversation_memory.push({
          role: 'consultant',
          at: new Date().toISOString(),
          kind: 'reasoning',
          text: llm.reasoning,
        });
      }
      message = c.confidence >= c.confidence_threshold
        ? 'Discovery confidence ≥ 90% (LLM+verifier). Proceed to industry intelligence.'
        : `Consultant follow-ups ready (LLM). Confidence ${Math.round(c.confidence * 100)}%.`;
    } else {
      c.llm = c.llm || {};
      c.llm.path = 'deterministic';
      c.llm.last_error = llm.error || 'llm_fallback';
      message =
        'LLM unavailable or rejected by verifier — deterministic interview continues.';
    }
  }

  c.ready_for_intelligence = c.confidence >= c.confidence_threshold;
  if (c.ready_for_intelligence) {
    e.discovery.completed = true;
    if (!message.includes('≥ 90%')) {
      message =
        'Discovery confidence ≥ 90%. Proceed to industry intelligence.';
    }
  }

  // Refresh next from pending if deterministic and empty llm next
  if (path === 'deterministic') {
    next = c.interview.pending
      .filter(
        (q) =>
          c.interview.answers[q.id] == null ||
          String(c.interview.answers[q.id]).trim() === '',
      )
      .slice(0, 3);
  }

  saveEngagement(e, cwd);
  return {
    engagement: e,
    confidence: c.confidence,
    confidence_dimensions: c.confidence_dimensions,
    threshold: c.confidence_threshold,
    ready: c.ready_for_intelligence,
    next_questions: next,
    remaining: c.interview.pending.filter(
      (q) =>
        c.interview.answers[q.id] == null ||
        String(c.interview.answers[q.id]).trim() === '',
    ).length,
    llm: { path, status: llmStatus() },
    message,
  };
}

function blendDims(det, llm) {
  const out = { ...det };
  if (!llm) return out;
  for (const k of Object.keys(det)) {
    if (typeof llm[k] === 'number') {
      // average with slight preference to deterministic floor
      out[k] = Math.min(
        0.99,
        Math.round(((det[k] * 0.45 + llm[k] * 0.55) ) * 100) / 100,
      );
    }
  }
  // overall never below deterministic
  out.overall = Math.max(det.overall, out.overall || 0);
  out.overall = Math.min(0.99, out.overall);
  return out;
}

export function loadCompetitorBenchmarks(ids, cwd) {
  const root = join(knowledgeRoot(cwd), 'competitors');
  return (ids || []).map((id) => {
    const p = join(root, `${id}.json`);
    if (!existsSync(p)) {
      return {
        id,
        name: id,
        strengths: [],
        weaknesses: [],
        modules: [],
        note: `Add knowledge/competitors/${id}.json`,
      };
    }
    return JSON.parse(readFileSync(p, 'utf8'));
  });
}

function loadPatterns(names, cwd) {
  const root = join(knowledgeRoot(cwd), 'patterns');
  return names.map((n) => {
    const p = join(root, `${n}.md`);
    return {
      id: n,
      body: existsSync(p) ? readFileSync(p, 'utf8').slice(0, 800) : null,
    };
  });
}

function synthesizeBenchmark(systems, industry) {
  const strengths = new Set();
  for (const s of systems) {
    for (const x of s.strengths || []) strengths.add(x);
  }
  return {
    industry,
    approach:
      'Combine proven workflow patterns from benchmarked systems into an original Grabber design — modules and outcomes, not copies.',
    patterns_to_adopt: [...strengths].slice(0, 12),
    systems_reviewed: systems.map((s) => s.name || s.id),
  };
}

/**
 * Stages 2–3: industry intelligence + competitor benchmark (patterns only).
 */
export function runIndustryIntelligence(engagementId, cwd) {
  const e = loadEngagement(engagementId, cwd);
  if (!e.consulting) e.consulting = emptyConsulting(e.industry, e.notes, cwd);
  if (e.consulting.confidence < e.consulting.confidence_threshold) {
    throw new Error(
      `discovery confidence ${e.consulting.confidence} < ${e.consulting.confidence_threshold}; continue interview`,
    );
  }

  const pb = loadPlaybook(e.industry, cwd);
  const pack = loadIndustryPack(e.industry, cwd);
  const benchIds = pack.benchmarks || defaultBenchmarkIds(e.industry);
  const benchmarks = loadCompetitorBenchmarks(benchIds, cwd);
  const graphNav = navigateFromIndustry(e.industry, cwd);
  const graphRecs = graphRecommendations(e.industry, cwd);

  e.consulting.knowledge_graph = {
    at: new Date().toISOString(),
    node_count: graphNav.node_count,
    edge_count: graphNav.edge_count,
    path_preview: graphRecs.path_preview,
    processes: graphRecs.processes,
    modules: graphRecs.modules,
  };

  e.consulting.industry_intelligence = {
    at: new Date().toISOString(),
    industry: e.industry,
    playbook_status: pb.status,
    typical_workflows:
      graphRecs.processes.length > 0
        ? graphRecs.processes
        : (pb.questions || []).map((q) => q.section).filter(Boolean),
    suggested_modules:
      graphRecs.modules.length > 0
        ? graphRecs.modules
        : pb.modules?.required || [],
    patterns: loadPatterns(['warehouse', 'purchasing', 'inventory'], cwd),
    pack_summary: pack.body ? pack.body.slice(0, 500) : null,
    knowledge_graph_driven: graphNav.node_count > 0,
  };

  e.consulting.benchmark = {
    at: new Date().toISOString(),
    legal_note: LEGAL_BOUNDARY,
    systems: benchmarks,
    synthesis: synthesizeBenchmark(benchmarks, e.industry),
  };

  e.consulting.stage = 'benchmark';
  return saveEngagement(e, cwd);
}

function whyCapability(name) {
  const map = {
    barcode_receiving: 'Reduces receiving errors and speeds put-away',
    batch_lot_tracking: 'Traceability for quality issues and recalls',
    landed_cost: 'True inventory valuation including freight and duty',
    customer_credit_limits: 'Protects cash flow and reduces bad debt',
    warehouse_transfers: 'Correct stock across multi-location operations',
    demand_forecasting: 'Improves purchase planning and stockouts',
    textile_roll_management: 'Handles roll/lot units common in textile wholesale',
    quality_inspection: 'Catch defects before stock is sellable',
    supplier_scorecards: 'Improve procurement reliability over time',
    container_shipment_tracking: 'Visibility on import containers and ETAs',
  };
  return map[name] || `Supports standard operations for: ${name.replace(/_/g, ' ')}`;
}

function effortCapability(name) {
  if (/forecast|dynamic|route|ai_|container/.test(name)) return 'high';
  if (/barcode|batch|credit|landed|transfer|textile|quality|supplier/.test(name)) return 'medium';
  return 'low';
}

function costBand(cls) {
  if (cls === CAPABILITY_CLASS.ADVANCED) return 'premium';
  if (cls === CAPABILITY_CLASS.RECOMMENDED) return 'standard_add_on';
  return 'included_core';
}

/**
 * Stage 4 — current vs best practice vs future state.
 * LLM enriches narratives; Decision Intelligence still owns provenance.
 */
export async function runGapAnalysis(engagementId, cwd) {
  const e = loadEngagement(engagementId, cwd);
  if (!e.consulting?.industry_intelligence) {
    throw new Error('run industry intelligence first');
  }
  const pack = loadIndustryPack(e.industry, cwd);
  const caps = pack.capabilities || defaultCapabilities(e.industry);
  const answers = e.consulting.interview?.answers || {};
  const graphCapIds = (e.consulting.knowledge_graph?.path_preview || []).map(
    (x) => String(x).toLowerCase().replace(/\s+/g, '_'),
  );

  const raw = [
    ...(caps.essential || []).map((name) => ({
      name,
      class: CAPABILITY_CLASS.ESSENTIAL,
      why: whyCapability(name),
      effort: effortCapability(name),
      cost_band: costBand(CAPABILITY_CLASS.ESSENTIAL),
    })),
    ...(caps.recommended || []).map((name) => ({
      name,
      class: CAPABILITY_CLASS.RECOMMENDED,
      why: whyCapability(name),
      effort: effortCapability(name),
      cost_band: costBand(CAPABILITY_CLASS.RECOMMENDED),
    })),
    ...(caps.advanced || []).map((name) => ({
      name,
      class: CAPABILITY_CLASS.ADVANCED,
      why: whyCapability(name),
      effort: effortCapability(name),
      cost_band: costBand(CAPABILITY_CLASS.ADVANCED),
    })),
  ];

  let current_state_summary =
    Object.entries(answers)
      .slice(0, 8)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ') || 'Sparse answers';
  let best_practice_summary =
    'Mature wholesale distribution: controlled receiving, accurate multi-location stock, credit discipline, purchasing controls, operational dashboards.';
  let future_state_summary =
    'Essential ERP core + justified recommended capabilities; advanced only when ROI is clear.';
  let llmPath = 'deterministic';

  if (isLlmAvailable()) {
    const enrich = await llmGapEnrichment({
      clientName: e.client_name,
      industry: e.industry,
      story: e.consulting.business_story || e.notes,
      answers,
      packSummary: pack.body?.slice(0, 1200) || '',
      capabilityNames: [
        ...(caps.essential || []),
        ...(caps.recommended || []),
        ...(caps.advanced || []),
      ],
    });
    if (enrich.ok && !enrich.fallback) {
      llmPath = 'llm';
      if (enrich.current_state_summary) {
        current_state_summary = enrich.current_state_summary;
      }
      if (enrich.best_practice_summary) {
        best_practice_summary = enrich.best_practice_summary;
      }
      if (enrich.future_state_summary) {
        future_state_summary = enrich.future_state_summary;
      }
      // Optional why overrides for known capabilities only
      for (const h of enrich.capability_hints || []) {
        const row = raw.find((r) => r.name === h.name);
        if (row && h.why) row.why = h.why;
      }
      recordLlmMeta(e.consulting, enrich.meta);
    } else {
      e.consulting.llm = e.consulting.llm || {};
      e.consulting.llm.last_error = enrich.error || 'gap_llm_fallback';
    }
  }

  // Decision Intelligence: provenance never from LLM project counts
  const recommendations = enrichRecommendations(raw, {
    industry: e.industry,
    answers,
    playbookStatus:
      pack.status || e.consulting.industry_intelligence?.playbook_status,
    graphCapabilities: [
      ...(e.consulting.knowledge_graph?.modules || []),
      ...graphCapIds,
      ...(caps.essential || []),
      ...(caps.recommended || []),
    ],
  });

  e.consulting.gap_analysis = {
    at: new Date().toISOString(),
    decision_intelligence: true,
    path: llmPath,
    status: 'scaffolded_ready_for_validation',
    current_state_summary,
    best_practice_summary,
    future_state_summary,
    recommendations,
    decision_briefs: recommendations.map(explainRecommendation),
    gaps_highlighted: recommendations
      .filter((r) => r.classification !== CAPABILITY_CLASS.ADVANCED)
      .slice(0, 14),
  };
  e.consulting.stage = 'gap_analysis';
  return saveEngagement(e, cwd);
}

/**
 * Stage 5 — professional department review (personas, not "agents").
 * LLM may draft findings; deterministic baseline if unavailable.
 */
export async function runMultiAgentReview(engagementId, cwd) {
  const e = loadEngagement(engagementId, cwd);
  if (!e.consulting?.gap_analysis) throw new Error('run gap analysis first');

  const recs = e.consulting.gap_analysis.recommendations || [];
  const names = recs.map((r) => r.id || r.name);

  let departments = defaultDepartments(names);
  let path = 'deterministic';

  if (isLlmAvailable()) {
    const llm = await llmDepartmentReview({
      clientName: e.client_name,
      industry: e.industry,
      story: e.consulting.business_story || e.notes,
      answers: e.consulting.interview?.answers,
      recommendations: recs,
      gapSummaries: {
        current: e.consulting.gap_analysis.current_state_summary,
        future: e.consulting.gap_analysis.future_state_summary,
      },
    });
    if (llm.ok && llm.departments?.length) {
      departments = llm.departments;
      path = 'llm';
      recordLlmMeta(e.consulting, llm.meta);
    } else {
      e.consulting.llm = e.consulting.llm || {};
      e.consulting.llm.last_error = llm.error || 'review_llm_fallback';
    }
  }

  const consolidated = [...new Set(departments.flatMap((r) => r.findings))];

  e.consulting.multi_agent_review = {
    at: new Date().toISOString(),
    model: 'professional_departments',
    path,
    personas: EXPERT_PERSONAS,
    departments,
    consolidated_recommendations: consolidated,
    client_visible: consolidated,
    client_framing:
      'Recommendations from your Grabber consulting team (not raw AI agent logs).',
  };
  e.consulting.stage = 'multi_agent_review';
  return saveEngagement(e, cwd);
}

function defaultDepartments(names) {
  return [
    {
      persona: 'business_consultant',
      role: 'Business Consultant',
      findings: ['inventory', 'purchasing', 'sales_orders'].every((n) =>
        names.includes(n),
      )
        ? ['Core commercial processes covered']
        : ['Inventory/purchasing/sales incomplete relative to wholesale norms'],
    },
    {
      persona: 'industry_specialist',
      role: 'Industry Specialist',
      findings: names.includes('textile_roll_management')
        ? ['Textile unit handling (rolls/meters) reflected in scope']
        : ['Confirm unit-of-measure model for textile wholesale'],
    },
    {
      persona: 'operations_manager',
      role: 'Operations Manager',
      findings: names.includes('barcode_receiving')
        ? ['Barcode receiving retained for warehouse throughput']
        : ['Add barcode receiving for warehouse operators'],
    },
    {
      persona: 'database_architect',
      role: 'Database Architect',
      findings: [
        'Normalize inventory, batch/lot, and location entities',
        'Separate SKU master from stock-on-hand balances',
      ],
    },
    {
      persona: 'security_officer',
      role: 'Security Officer',
      findings: [
        'Require audit logging on stock adjustments and credit overrides',
      ],
    },
    {
      persona: 'finance_consultant',
      role: 'Finance Consultant',
      findings: names.includes('landed_cost')
        ? ['Landed cost path supports inventory valuation']
        : ['Integrate landed costs into inventory valuation'],
    },
    {
      persona: 'ux_director',
      role: 'UX Director',
      findings: [
        'Warehouse operators need simplified mobile-first receiving screens',
        'Managers need exception dashboards, not dense ERP forms',
      ],
    },
    {
      persona: 'solution_architect',
      role: 'Solution Architect',
      findings: [
        'Modular delivery via approved catalog modules — original design, pattern-informed',
      ],
    },
    {
      persona: 'delivery_manager',
      role: 'Delivery Manager',
      findings: [
        'Phased delivery: core ops first, recommended capabilities next, advanced later',
      ],
    },
  ];
}

function recordLlmMeta(consulting, meta) {
  if (!meta) return;
  consulting.llm = consulting.llm || { turns: 0, cost_usd: 0 };
  consulting.llm.used = true;
  consulting.llm.path = 'llm';
  consulting.llm.model = meta.model;
  consulting.llm.turns = (consulting.llm.turns || 0) + 1;
  consulting.llm.cost_usd =
    Math.round(((consulting.llm.cost_usd || 0) + (meta.cost_usd || 0)) * 1e6) /
    1e6;
}

function mapCapabilitiesToModules(recommendations) {
  const map = {
    inventory: 'inventory',
    purchasing: 'inventory',
    sales_orders: 'orders',
    customers: 'crm',
    suppliers: 'crm',
    warehouses: 'inventory',
    barcode_receiving: 'inventory',
    batch_lot_tracking: 'inventory',
    payments: 'payments',
    booking: 'booking',
    calendar: 'calendar',
    notifications: 'notifications',
    analytics: 'analytics',
    authentication: 'authentication',
    rbac: 'rbac',
  };
  const mods = new Set(['authentication', 'rbac']);
  for (const r of recommendations || []) {
    const cls = r.classification || r.class;
    if (cls === CAPABILITY_CLASS.ADVANCED) continue;
    const key = r.id || r.name;
    const m = map[key];
    if (m) mods.add(m);
  }
  return [...mods];
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

/**
 * Stage 6 — full package (business → legal). DNA draft only; factory locked.
 */
export function produceSolutionPackage(engagementId, cwd) {
  const e = loadEngagement(engagementId, cwd);
  if (!e.consulting?.multi_agent_review) {
    throw new Error('run multi-agent review first');
  }

  const answers = e.consulting.interview.answers || {};
  const recs = e.consulting.gap_analysis.recommendations || [];
  const modules = mapCapabilitiesToModules(recs);
  const integrations = ['supabase', 'github', 'vercel'];
  const blueprint =
    e.industry === 'hospitality' || e.industry === 'restaurants' ? 'booking' : 'saas';

  e.analysis = {
    at: new Date().toISOString(),
    executive_summary: `${e.client_name}: consulting-led solution for ${e.industry}. Discovery confidence ${e.consulting.confidence}. Blueprint before software.`,
    pain_points: answers.pain
      ? String(answers.pain)
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : ['Manual processes', 'Limited stock visibility'],
    opportunities: recs
      .filter(
        (r) =>
          (r.classification || r.class) === CAPABILITY_CLASS.ESSENTIAL,
      )
      .slice(0, 5)
      .map((r) => r.id || r.name),
    processes: ['receive', 'stock', 'purchase', 'sell', 'credit', 'report'],
    competitors: (e.consulting.benchmark?.systems || []).map((s) => s.name || s.id),
    roi: {
      estimated_hours_saved_per_month: 60 + modules.length * 4,
      estimated_payback_months: 4,
      confidence: e.consulting.confidence,
    },
  };

  e.solution = {
    at: new Date().toISOString(),
    blueprint,
    modules,
    integrations,
    architecture: 'modular-monolith',
    stack: 'Next.js + Supabase',
    timeline_weeks: Math.max(6, Math.ceil(modules.length / 2)),
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
        { role: 'warehouse', goals: ['receive', 'transfer'] },
        { role: 'sales', goals: ['order', 'credit-check'] },
        { role: 'finance', goals: ['valuation', 'collections'] },
      ],
      critical_flows: e.analysis.processes,
      standards_version: 'stds-1.0.0',
    },
    modules,
    integrations,
    deployment: { provider: 'vercel' },
    quality: { security: 'high', testing: 'required' },
    governance: {
      engagement_id: e.id,
      stage: e.governance_stage,
      consulting_stage: e.consulting.stage,
    },
  };

  e.commercial = generateCommercialPackage(e);
  e.risks = (loadPlaybook(e.industry, cwd).risks || []).map((r) =>
    typeof r === 'string'
      ? { id: slug(r).slice(0, 8), severity: 'medium', description: r, mitigation: 'SOW + UAT' }
      : r,
  );

  e.consulting.maturity = assessBusinessMaturity(
    e.consulting.interview.answers,
    e.industry,
  );
  e.consulting.roi = estimateConsultingRoi(e.consulting.interview.answers, recs);
  e.consulting.executive_presentation = buildExecutivePresentation(e);
  e.consulting.executive_html = renderExecutiveHtml(e);

  const pkg = {
    at: new Date().toISOString(),
    positioning: PRODUCT_TAGLINES.simple,
    charter_applied: true,
    legal_boundary: LEGAL_BOUNDARY,
    confidence: e.consulting.confidence_dimensions,
    business_maturity: e.consulting.maturity,
    roi: e.consulting.roi,
    executive_presentation: e.consulting.executive_presentation,
    executive_html_available: Boolean(e.consulting.executive_html),
    llm: {
      used: Boolean(e.consulting.llm?.used),
      path: e.consulting.llm?.path || 'deterministic',
      model: e.consulting.llm?.model || null,
      cost_usd: e.consulting.llm?.cost_usd || 0,
    },
    business: {
      executive_summary: e.analysis.executive_summary,
      business_analysis: e.analysis,
      pain_points: e.analysis.pain_points,
      objectives: e.analysis.opportunities,
      process_maps: e.analysis.processes,
    },
    functional: {
      requirements: recs
        .filter(
          (r) =>
            r.classification === CAPABILITY_CLASS.ESSENTIAL ||
            r.classification === CAPABILITY_CLASS.RECOMMENDED ||
            r.class === CAPABILITY_CLASS.ESSENTIAL ||
            r.class === CAPABILITY_CLASS.RECOMMENDED,
        )
        .map((r) => ({
          capability: r.id || r.name,
          label: r.recommendation || r.name,
          class: r.classification || r.class,
          why: r.reason || r.why,
          confidence: r.confidence,
          sources: r.sources,
          business_impact: r.business_impact,
          effort: r.estimated_effort || r.effort,
          cost_band: r.cost_band,
          if_excluded: r.if_excluded,
          explainable: r.explainable,
          user_stories: [
            `As an operator, I need ${(r.id || r.name || '').replace(/_/g, ' ')} so that ${(r.business_impact || [])[0] || r.why}`,
          ],
        })),
      decision_briefs: e.consulting.gap_analysis?.decision_briefs || [],
      roles: ['admin', 'purchaser', 'warehouse', 'sales', 'finance'],
      permission_matrix: 'rbac — refined at DNA approval',
    },
    technical: {
      architecture: e.solution.architecture,
      modules: e.solution.modules,
      integrations: e.solution.integrations,
      api_strategy: 'REST envelope data/error+trace_id',
      data_model_notes: e.consulting.multi_agent_review.client_visible.filter((x) =>
        /normaliz|entit|SKU|batch/i.test(x),
      ),
    },
    design: {
      sitemap: ['Dashboard', 'Inventory', 'Purchasing', 'Sales', 'Warehouses', 'Reports'],
      screen_inventory: [
        'Receive goods',
        'Stock adjustment',
        'Sales order',
        'Customer credit',
        'Purchase order',
      ],
      navigation: 'role-based primary nav; mobile warehouse subset',
      design_system: 'Grabber UI standard — original, not competitor pixel copy',
      dashboard_concepts: ['Stock health', 'Receiving queue', 'Credit risk', 'Purchase pipeline'],
    },
    commercial: e.commercial,
    legal: {
      sow: e.commercial.deliverables?.statement_of_work,
      msa_draft: e.commercial.deliverables?.msa_draft,
      acceptance: e.commercial.deliverables?.user_acceptance_criteria,
    },
    consulting_trail: {
      confidence: e.consulting.confidence,
      confidence_dimensions: e.consulting.confidence_dimensions,
      knowledge_graph: e.consulting.knowledge_graph,
      benchmark_synthesis: e.consulting.benchmark?.synthesis,
      consolidated_review: e.consulting.multi_agent_review.client_visible,
      departments: e.consulting.multi_agent_review.departments?.map((d) => d.role),
    },
    // Internal only — not shown as "factory" to clients
    delivery: {
      implementation_ready_for_governance: true,
      manufacturing_unlocked: false,
      note: 'Internal manufacturing starts only after dual approval + deposit. Client narrative: consulting team delivery.',
    },
  };

  e.consulting.solution_package = pkg;
  e.consulting.stage = 'solution_package';
  e.status = 'commercial';
  e.governance_stage = 'commercial_review';
  e.deliverables = e.commercial.deliverables;

  return saveEngagement(e, cwd);
}

/**
 * Full consulting path used by tests / CLI demos.
 */
export async function runConsultingPipeline(input, answers, cwd) {
  let e = startConsultation(input, cwd);
  let step = await answerDiscovery(e.id, answers, cwd);
  e = step.engagement;

  if (!step.ready) {
    const fill = {};
    for (const q of e.consulting.interview.pending) {
      if (
        e.consulting.interview.answers[q.id] == null ||
        String(e.consulting.interview.answers[q.id]).trim().length < 12
      ) {
        fill[q.id] =
          answers[q.id] ||
          `Detailed operational answer for ${q.id}: current process documented with owners, volume, and tools used in day-to-day work.`;
      }
    }
    step = await answerDiscovery(e.id, { ...answers, ...fill }, cwd);
    e = step.engagement;
  }

  if (!step.ready) {
    return {
      engagement: e,
      blocked: 'discovery',
      confidence: step.confidence,
      confidence_dimensions: step.confidence_dimensions,
      next_questions: step.next_questions,
      llm: step.llm,
    };
  }

  e = runIndustryIntelligence(e.id, cwd);
  e = await runGapAnalysis(e.id, cwd);
  e = await runMultiAgentReview(e.id, cwd);
  e = produceSolutionPackage(e.id, cwd);

  return {
    engagement: e,
    blocked: null,
    package: e.consulting.solution_package,
    executive_html: e.consulting.executive_html,
    factory_eligible: e.factory_eligible,
    llm: e.consulting.llm,
  };
}

export function getConsultingStatus(engagementId, cwd) {
  const e = loadEngagement(engagementId, cwd);
  const c = e.consulting;
  if (!c) return { ok: false, error: 'not a consulting engagement' };
  return {
    ok: true,
    stage: c.stage,
    confidence: c.confidence,
    threshold: c.confidence_threshold,
    ready_for_intelligence: c.confidence >= c.confidence_threshold,
    has_package: Boolean(c.solution_package),
    has_executive_html: Boolean(c.executive_html),
    llm: c.llm || { path: 'deterministic', used: false },
    llm_status: llmStatus(),
    next_questions: (c.interview?.pending || [])
      .filter((q) => c.interview.answers[q.id] == null)
      .slice(0, 5),
    legal_boundary: c.legal_boundary,
    conversation_turns: (c.conversation_memory || []).length,
  };
}

/** Return executive HTML for an engagement (client-readable). */
export function getExecutiveHtml(engagementId, cwd) {
  const e = loadEngagement(engagementId, cwd);
  if (e.consulting?.executive_html) return e.consulting.executive_html;
  return renderExecutiveHtml(e);
}
