/**
 * LLM prompt builders for Jarvis consulting (reasoning only).
 * Outputs always pass through verifier.js before use.
 */
import { callModel, isLlmAvailable } from './llm.js';
import {
  verifyDiscoveryOutput,
  verifyGapEnrichment,
  verifyDepartmentReview,
} from './verifier.js';
import { JARVIS_CONSULTANT_CHARTER, EXPERT_PERSONAS } from './consulting-constants.js';

export { isLlmAvailable };

/**
 * Follow-up interview + confidence reasoning.
 */
export async function llmDiscoveryTurn({
  clientName,
  industry,
  story,
  answers,
  asked,
  packSummary,
  deterministicOverall,
}) {
  const answeredCount = Object.keys(answers || {}).filter(
    (k) => String(answers[k] || '').trim().length >= 2,
  ).length;

  const user = JSON.stringify(
    {
      client: clientName,
      industry,
      business_story: story,
      answers_so_far: answers,
      already_asked_ids: asked,
      industry_pack_excerpt: packSummary,
      task: 'Continue discovery as a senior industry consultant. Ask only the next 1-3 highest-value questions you still need. Score confidence dimensions 0-1 honestly.',
    },
    null,
    2,
  );

  const schemaHint = `{
  "next_questions": [{ "id": "snake_case_id", "prompt": "question text", "section": "operations|business_profile|goals", "required": true }],
  "confidence_dimensions": {
    "business_understanding": 0.0,
    "requirements": 0.0,
    "operations": 0.0,
    "warehouse": 0.0,
    "accounting": 0.0,
    "reporting": 0.0,
    "compliance": 0.0,
    "overall": 0.0
  },
  "reasoning": "brief consultant notes (not shown as evidence counts)"
}`;

  const res = await callModel({
    system: JARVIS_CONSULTANT_CHARTER,
    user,
    schemaHint,
    maxTokens: 1600,
  });

  if (!res.ok) return { ok: false, fallback: true, error: res.error };

  const verified = verifyDiscoveryOutput(res.data, {
    answeredCount,
    deterministicOverall,
  });

  return {
    ok: verified.ok,
    fallback: !verified.ok,
    error: verified.errors?.join('; '),
    ...verified,
    meta: {
      model: res.model,
      tokens_in: res.tokens_in,
      tokens_out: res.tokens_out,
      cost_usd: res.cost_usd,
    },
  };
}

/**
 * Narrative enrichment for gap analysis (not evidence fabrication).
 */
export async function llmGapEnrichment({
  clientName,
  industry,
  story,
  answers,
  packSummary,
  capabilityNames,
}) {
  const user = JSON.stringify(
    {
      client: clientName,
      industry,
      business_story: story,
      answers,
      industry_pack_excerpt: packSummary,
      known_capabilities: capabilityNames,
      task: 'Write consultant narratives for current state, industry best practice, and recommended future state. Optionally hint extra capability ids from known_capabilities with short why. Do NOT invent project counts or fake evidence.',
    },
    null,
    2,
  );

  const schemaHint = `{
  "current_state_summary": "string",
  "best_practice_summary": "string",
  "future_state_summary": "string",
  "capability_hints": [{ "name": "capability_id", "why": "string" }],
  "reasoning": "string"
}`;

  const res = await callModel({
    system: JARVIS_CONSULTANT_CHARTER,
    user,
    schemaHint,
    maxTokens: 1800,
  });

  if (!res.ok) return { ok: false, fallback: true, error: res.error };

  const verified = verifyGapEnrichment(res.data);
  return {
    ...verified,
    fallback: !verified.ok,
    meta: {
      model: res.model,
      tokens_in: res.tokens_in,
      tokens_out: res.tokens_out,
      cost_usd: res.cost_usd,
    },
  };
}

/**
 * Multi-department review via LLM + persona list.
 */
export async function llmDepartmentReview({
  clientName,
  industry,
  story,
  answers,
  recommendations,
  gapSummaries,
}) {
  const personas = EXPERT_PERSONAS.map((p) => p.title).join(', ');
  const user = JSON.stringify(
    {
      client: clientName,
      industry,
      business_story: story,
      answers,
      recommendations: (recommendations || []).slice(0, 20).map((r) => ({
        id: r.id || r.name,
        class: r.classification || r.class,
        why: r.reason || r.why,
      })),
      gap_summaries: gapSummaries,
      departments: personas,
      task: 'Produce a multi-disciplinary consulting review. Each department: 1-3 concrete findings. No fake project statistics.',
    },
    null,
    2,
  );

  const schemaHint = `{
  "departments": [
    { "persona": "id", "role": "Title", "findings": ["string"] }
  ],
  "reasoning": "string"
}`;

  const res = await callModel({
    system: JARVIS_CONSULTANT_CHARTER,
    user,
    schemaHint,
    maxTokens: 2000,
  });

  if (!res.ok) return { ok: false, fallback: true, error: res.error };

  const verified = verifyDepartmentReview(res.data);
  return {
    ...verified,
    fallback: !verified.ok,
    meta: {
      model: res.model,
      tokens_in: res.tokens_in,
      tokens_out: res.tokens_out,
      cost_usd: res.cost_usd,
    },
  };
}
