import { COMMERCIAL_DELIVERABLES } from './types.js';
import { createHash } from 'node:crypto';

/**
 * Generate full commercial package for an engagement (Milestone 3).
 */
export function generateCommercialPackage(engagement) {
  const s = engagement.solution;
  const a = engagement.analysis;
  const weeks = s.timeline_weeks || 6;
  const moduleCount = s.modules?.length || 6;
  const basePrice = 8000 + moduleCount * 1200 + weeks * 1500;
  const deposit = Math.round(basePrice * 0.4);
  const currency = 'USD';

  const ids = {};
  for (const d of COMMERCIAL_DELIVERABLES) {
    ids[d.split('_')[0] === 'statement' ? 'sow' : d] = hashId(
      engagement.id,
      d,
    );
  }
  ids.proposal = hashId(engagement.id, 'proposal');
  ids.sow = hashId(engagement.id, 'sow');

  const deliverables = {};
  for (const key of COMMERCIAL_DELIVERABLES) {
    deliverables[key] = renderDeliverable(key, engagement, {
      basePrice,
      deposit,
      weeks,
      currency,
    });
  }

  return {
    at: new Date().toISOString(),
    currency,
    pricing: {
      total: basePrice,
      deposit,
      remainder: basePrice - deposit,
      currency,
      payment_terms: '40% deposit, 40% UAT, 20% go-live',
    },
    timeline: {
      weeks,
      milestones: [
        { name: 'Discovery complete', week: 1 },
        { name: 'DNA approved + deposit', week: 2 },
        { name: 'Factory build', week: Math.ceil(weeks * 0.6) },
        { name: 'UAT', week: weeks - 1 },
        { name: 'Production', week: weeks },
      ],
    },
    ids,
    deliverables,
    summary: {
      client: engagement.client_name,
      industry: engagement.industry,
      blueprint: s.blueprint,
      modules: s.modules,
      total: basePrice,
      deposit,
      roi: a?.roi,
    },
  };
}

function renderDeliverable(key, e, fin) {
  const title = key
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
  const base = {
    id: hashId(e.id, key),
    type: key,
    title,
    client: e.client_name,
    generated_at: new Date().toISOString(),
  };

  switch (key) {
    case 'executive_summary':
      return {
        ...base,
        body: e.analysis?.executive_summary || `${e.client_name} digital delivery via Grabber Factory.`,
      };
    case 'business_analysis':
      return {
        ...base,
        pain_points: e.analysis?.pain_points || [],
        opportunities: e.analysis?.opportunities || [],
        processes: e.analysis?.processes || [],
      };
    case 'requirements_specification':
      return {
        ...base,
        functional: e.project_dna?.project?.critical_flows || [],
        goals: e.project_dna?.project?.goals || [],
      };
    case 'functional_scope':
      return {
        ...base,
        in_scope_modules: e.solution?.modules || [],
        out_of_scope: ['Custom non-catalog features without CR'],
      };
    case 'non_functional_requirements':
      return {
        ...base,
        security: e.project_dna?.quality?.security || 'standard',
        testing: 'required',
        accessibility: 'WCAG-2.1-AA',
      };
    case 'solution_overview':
      return {
        ...base,
        blueprint: e.solution?.blueprint,
        architecture: e.solution?.architecture,
        stack: e.solution?.stack,
      };
    case 'architecture_summary':
      return {
        ...base,
        style: 'modular-monolith',
        modules: e.solution?.modules,
        integrations: e.solution?.integrations,
      };
    case 'module_selection':
      return { ...base, modules: e.solution?.modules || [] };
    case 'integration_plan':
      return {
        ...base,
        integrations: e.solution?.integrations || [],
        sequence: ['github', 'supabase', 'stripe', 'vercel'].filter((i) =>
          (e.solution?.integrations || []).includes(i),
        ),
      };
    case 'timeline':
      return { ...base, ...fin, weeks: fin.weeks };
    case 'cost_estimate':
      return {
        ...base,
        currency: fin.currency,
        total: fin.basePrice,
        deposit: fin.deposit,
        line_items: [
          { item: 'Product Factory delivery', amount: fin.basePrice * 0.7 },
          { item: 'Discovery & commercial', amount: fin.basePrice * 0.15 },
          { item: 'UAT & deploy', amount: fin.basePrice * 0.15 },
        ],
      };
    case 'risk_register':
      return { ...base, risks: e.risks || [] };
    case 'proposal':
      return {
        ...base,
        headline: `Proposal for ${e.client_name}`,
        investment: fin.basePrice,
        deposit: fin.deposit,
        blueprint: e.solution?.blueprint,
        validity_days: 30,
      };
    case 'statement_of_work':
      return {
        ...base,
        parties: [e.client_name, 'Grabber AI Studio'],
        modules: e.solution?.modules,
        payment_terms: '40% deposit, 40% UAT, 20% go-live',
        change_control: 'All scope changes via Change Request template',
      };
    case 'msa_draft':
      return {
        ...base,
        body: 'Master Service Agreement draft — governing terms for professional services and Product Factory delivery. Not legal advice; counsel review required.',
      };
    case 'change_request_template':
      return {
        ...base,
        fields: ['description', 'impact_timeline', 'impact_cost', 'approval'],
      };
    case 'maintenance_plan':
      return {
        ...base,
        sla: 'Business hours response',
        renewals: 'Annual',
        includes: ['monitoring', 'security patches', 'minor fixes'],
      };
    case 'user_acceptance_criteria':
      return {
        ...base,
        criteria: (e.project_dna?.project?.critical_flows || []).map((f) => ({
          flow: f,
          pass: `User can complete: ${f}`,
        })),
      };
    case 'deployment_plan':
      return {
        ...base,
        steps: [
          'GitHub repo',
          'Supabase project',
          'Stripe config',
          'Vercel production',
          'Smoke UAT',
        ],
        provider: 'vercel',
      };
    default:
      return base;
  }
}

function hashId(engagementId, key) {
  return createHash('sha256')
    .update(`${engagementId}:${key}`)
    .digest('hex')
    .slice(0, 12);
}
