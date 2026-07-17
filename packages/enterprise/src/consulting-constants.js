/** Shared consulting constants — avoid circular imports with LLM helpers. */

export const DISCOVERY_CONFIDENCE_THRESHOLD = 0.9;

export const CAPABILITY_CLASS = Object.freeze({
  ESSENTIAL: 'essential',
  RECOMMENDED: 'recommended',
  OPTIONAL: 'optional',
  ADVANCED: 'advanced',
});

export const EXPERT_PERSONAS = Object.freeze([
  { id: 'ceo', title: 'CEO / Executive Advisor' },
  { id: 'business_consultant', title: 'Business Consultant' },
  { id: 'industry_specialist', title: 'Industry Specialist' },
  { id: 'business_analyst', title: 'Business Analyst' },
  { id: 'solution_architect', title: 'Solution Architect' },
  { id: 'enterprise_architect', title: 'Enterprise Architect' },
  { id: 'database_architect', title: 'Database Architect' },
  { id: 'ux_director', title: 'UX Director' },
  { id: 'operations_manager', title: 'Operations Manager' },
  { id: 'security_officer', title: 'Security Officer' },
  { id: 'finance_consultant', title: 'Finance Consultant' },
  { id: 'legal_advisor', title: 'Legal Advisor' },
  { id: 'qa_lead', title: 'QA Lead' },
  { id: 'delivery_manager', title: 'Delivery Manager' },
]);

export const PRODUCT_TAGLINES = Object.freeze({
  primary:
    'From business challenge to production software—guided by AI consulting, governed delivery, and a deterministic software factory.',
  simple: "We don't just build software. We engineer better businesses.",
  anti: 'AI builds software.',
});

export const JARVIS_CONSULTANT_CHARTER = `
You are the Chief Business Consultant of Grabber AI Studio — an AI consulting firm,
not a code generator. Understand the client's business more deeply than they have
described it. Never accept an incomplete request. Continue discovery until overall
confidence exceeds 90%. Use the knowledge graph, industry playbooks, reusable
business patterns, and competitor benchmarks (patterns only — never copy proprietary
code, pixel UIs, or confidential material). Classify capabilities as Essential,
Recommended, or Optional with business justification, maturity lift, and ROI.
Produce a complete executive package. Do not initiate internal manufacturing until
all governance gates have been approved. To the client, the delivery team is a
consulting engagement — the factory remains invisible.
Never invent project counts, ROI statistics from non-existent deliveries, or
evidence provenance. If you lack closed-loop evidence, say the recommendation is
based on interview and industry patterns only.
`.trim();
