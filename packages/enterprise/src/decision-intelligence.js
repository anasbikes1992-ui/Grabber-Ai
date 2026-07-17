/**
 * Decision Intelligence — explainable, provenance-backed recommendations.
 * Strategic endpoint capability: every rec answers why / based on what / impact / cost.
 * Scaffold for validation — graduate to "proven" only after real client use.
 */

/** Local class labels — do not re-export (conflicts with consulting CAPABILITY_CLASS). */
const CLASS = Object.freeze({
  ESSENTIAL: 'essential',
  RECOMMENDED: 'recommended',
  OPTIONAL: 'optional',
  ADVANCED: 'advanced',
});

/**
 * Build a single explainable recommendation with full provenance.
 */
export function buildRecommendation({
  name,
  classification,
  industry,
  clientAnswers = {},
  graphHint = null,
  playbookStatus = 'planned',
  why,
  effort = 'medium',
  cost_band = 'standard_add_on',
}) {
  const label = humanize(name);
  const mentioned = clientMentioned(name, clientAnswers);
  const sources = collectSources({
    name,
    industry,
    mentioned,
    graphHint,
    playbookStatus,
  });
  const confidence = scoreRecommendationConfidence({
    classification,
    sources,
    mentioned,
    playbookStatus,
    graphHint,
  });
  const businessImpact = impactFor(name);
  const ifExcluded = exclusionRisk(name, classification);

  return {
    recommendation: label,
    id: name,
    confidence,
    classification,
    // Client-friendly aliases
    required_or_optional:
      classification === CLASS.ESSENTIAL
        ? 'Required'
        : classification === CLASS.ADVANCED
          ? 'Optional (advanced)'
          : 'Recommended',
    reason: why || whyDefault(name),
    why: why || whyDefault(name),
    evidence: sources,
    sources,
    business_impact: businessImpact,
    businessImpact,
    estimated_effort: effort,
    implementation_cost: effort,
    cost_band,
    if_excluded: ifExcluded,
    value_delivered: businessImpact,
    client_mentioned: mentioned,
    explainable: {
      why: why || whyDefault(name),
      based_on: sources,
      problem_solved: businessImpact[0] || 'Operational efficiency',
      required: classification === CLASS.ESSENTIAL,
      if_not_included: ifExcluded,
      cost: effort,
      value: businessImpact,
    },
  };
}

function humanize(name) {
  return String(name)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function clientMentioned(name, answers) {
  const text = Object.values(answers).join(' ').toLowerCase();
  const tokens = name.replace(/_/g, ' ').split(' ');
  if (tokens.some((t) => t.length > 3 && text.includes(t))) return true;
  // soft match stems / related ops language
  if (name.includes('barcode') && /barcode|scan|manual\s+receiv|inventory error/.test(text)) {
    return true;
  }
  if (name.includes('batch') && /batch|lot|trace/.test(text)) return true;
  if (name.includes('credit') && /credit|limit|debt/.test(text)) return true;
  if (tokens.some((t) => t.length > 4 && text.includes(t.slice(0, -1)))) return true;
  return false;
}

function collectSources({ name, industry, mentioned, graphHint, playbookStatus }) {
  const sources = [];
  const industryLabel =
    industry === 'wholesale-distribution'
      ? 'Wholesale Distribution Playbook'
      : `${humanize(industry)} Playbook`;

  if (playbookStatus === 'seed' || playbookStatus === 'seed') {
    sources.push(industryLabel);
  } else {
    sources.push(`${industryLabel} (planned pack — pattern defaults)`);
  }

  if (/inventory|warehouse|barcode|batch|purchas|credit|landed|quality|textile/.test(name)) {
    sources.push('Inventory / Warehouse Management Pattern');
  }
  if (/sales|customer|order/.test(name)) {
    sources.push('Sales & Order Management Pattern');
  }
  if (graphHint) {
    sources.push('Enterprise Knowledge Graph');
  }
  if (mentioned) {
    sources.push('Client Interview Responses');
  }
  sources.push('Industry Best-Practice Benchmarks (patterns only)');
  // Reserved for continuous improvement loop
  sources.push('Prior Grabber Project Knowledge (when available)');

  return [...new Set(sources)];
}

function scoreRecommendationConfidence({
  classification,
  sources,
  mentioned,
  playbookStatus,
  graphHint,
}) {
  let c = 0.72;
  if (playbookStatus === 'seed') c += 0.08;
  if (graphHint) c += 0.06;
  if (mentioned) c += 0.05;
  if (sources.length >= 4) c += 0.04;
  if (classification === CLASS.ESSENTIAL) c += 0.04;
  if (classification === CLASS.ADVANCED) c -= 0.08;
  return Math.min(0.98, Math.round(c * 100) / 100);
}

function whyDefault(name) {
  const map = {
    barcode_receiving:
      'Inventory errors are common in wholesale warehouses; barcode receiving reduces manual entry and improves receiving accuracy.',
    batch_lot_tracking:
      'Lot/batch tracking enables quality control, recalls, and supplier return traceability.',
    landed_cost:
      'Without landed cost, inventory valuation ignores freight and duty — distorting margin and pricing.',
    customer_credit_limits:
      'Credit limits prevent over-extension and reduce bad debt on B2B wholesale accounts.',
    inventory:
      'Core stock visibility is required to sell, purchase, and fulfill reliably.',
    purchasing:
      'Controlled purchasing links demand to suppliers and receiving documents.',
    sales_orders:
      'Order management is the commercial spine of wholesale operations.',
    warehouses:
      'Multi-location stock requires explicit warehouse and location control.',
    quality_inspection:
      'Inspection before put-away prevents selling defective stock.',
    textile_roll_management:
      'Textile wholesale often sells by roll/meter — unit models must match the physical product.',
  };
  return (
    map[name] ||
    `${humanize(name)} addresses a standard operational need for businesses of this type.`
  );
}

function impactFor(name) {
  const map = {
    barcode_receiving: [
      'Faster receiving',
      'Lower error rate',
      'Better stock accuracy',
    ],
    batch_lot_tracking: ['Traceability', 'Quality control', 'Supplier returns'],
    landed_cost: ['True inventory valuation', 'Clearer margins', 'Better pricing'],
    customer_credit_limits: [
      'Cash-flow protection',
      'Lower bad debt',
      'Order holds when over limit',
    ],
    inventory: ['Stock visibility', 'Fewer stockouts', 'Operational control'],
    purchasing: ['Supplier control', 'PO discipline', 'Receive against order'],
    sales_orders: ['Order accuracy', 'Fulfillment tracking', 'Revenue process'],
    warehouses: ['Location accuracy', 'Transfer control', 'Multi-site stock'],
    quality_inspection: ['Defect containment', 'Customer quality', 'Returns reduction'],
    textile_roll_management: [
      'Correct unit handling',
      'Less waste',
      'Accurate available-to-promise',
    ],
  };
  return map[name] || ['Operational efficiency', 'Process consistency'];
}

function exclusionRisk(name, classification) {
  if (classification === CLASS.ESSENTIAL) {
    return `Excluding ${humanize(name)} typically blocks core operations for this business type.`;
  }
  if (classification === CLASS.RECOMMENDED) {
    return `Excluding ${humanize(name)} increases operational risk and manual work; acceptable only with explicit client trade-off.`;
  }
  return `Excluding ${humanize(name)} defers advanced capability; revisit after go-live if ROI justifies.`;
}

/**
 * Attach Decision Intelligence envelope to a list of raw capability rows.
 */
export function enrichRecommendations(rawList, ctx = {}) {
  return (rawList || []).map((r) =>
    buildRecommendation({
      name: r.name || r.id || r.recommendation,
      classification: r.class || r.classification || CLASS.RECOMMENDED,
      industry: ctx.industry,
      clientAnswers: ctx.answers || {},
      graphHint: ctx.graphCapabilities?.includes(r.name),
      playbookStatus: ctx.playbookStatus || 'planned',
      why: r.why,
      effort: r.effort || 'medium',
      cost_band: r.cost_band,
    }),
  );
}

/**
 * Client-facing decision brief for one recommendation.
 */
export function explainRecommendation(rec) {
  return {
    recommendation: rec.recommendation,
    reason: rec.reason,
    confidence_pct: Math.round((rec.confidence || 0) * 100),
    evidence: rec.sources,
    business_impact: rec.business_impact,
    estimated_effort: rec.estimated_effort,
    classification: rec.required_or_optional,
    if_excluded: rec.if_excluded,
    explainable_answers: {
      why: rec.explainable?.why,
      based_on: rec.explainable?.based_on,
      problem: rec.explainable?.problem_solved,
      required: rec.explainable?.required,
      if_not_included: rec.explainable?.if_not_included,
      cost: rec.explainable?.cost,
      value: rec.explainable?.value,
    },
  };
}
