/**
 * Deterministic verifier — validates LLM consulting outputs before use.
 * LLM reasons; verifier gates. Never invents evidence provenance.
 */

/**
 * @param {object} data
 * @param {{ answeredCount: number, deterministicOverall: number }} ctx
 */
export function verifyDiscoveryOutput(data, ctx = {}) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['not an object'] };
  }

  let next = data.next_questions || data.nextQuestions || [];
  if (!Array.isArray(next)) {
    errors.push('next_questions must be array');
    next = [];
  }
  next = next
    .slice(0, 5)
    .map((q, i) => {
      if (typeof q === 'string') {
        return {
          id: `llm-${i + 1}`,
          prompt: q,
          section: 'llm_followup',
          weight: 0.08,
          required: true,
        };
      }
      const prompt = String(q.prompt || q.question || '').trim();
      if (!prompt || prompt.length < 10) return null;
      return {
        id: String(q.id || `llm-${i + 1}`).replace(/[^a-z0-9_-]/gi, '_').slice(0, 40),
        prompt: prompt.slice(0, 400),
        section: q.section || 'llm_followup',
        weight: Number(q.weight) || 0.08,
        required: q.required !== false,
      };
    })
    .filter(Boolean);

  const dimsIn = data.confidence_dimensions || data.confidenceDimensions || {};
  const dims = normalizeDims(dimsIn);
  const answered = ctx.answeredCount ?? 0;
  const det = ctx.deterministicOverall ?? 0;

  // Cap inflated confidence without enough answers
  if (answered < 4 && dims.overall > 0.55) {
    dims.overall = Math.min(dims.overall, 0.55);
  }
  if (answered < 8 && dims.overall > 0.85) {
    dims.overall = Math.min(dims.overall, 0.85);
  }
  // Must not jump more than +0.2 over deterministic floor in one step
  if (dims.overall > det + 0.2) {
    dims.overall = Math.round((det + 0.2) * 100) / 100;
  }

  const reasoning = String(data.reasoning || data.summary || '').slice(0, 2000);

  return {
    ok: errors.length === 0,
    errors,
    next_questions: next,
    confidence_dimensions: dims,
    reasoning,
  };
}

/**
 * Verify LLM gap-analysis narrative enrichment (not provenance fields).
 */
export function verifyGapEnrichment(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['not an object'] };
  }
  const future = String(
    data.future_state_summary || data.futureState || data.recommended_future_state || '',
  ).slice(0, 2000);
  const best = String(
    data.best_practice_summary || data.bestPractice || '',
  ).slice(0, 2000);
  const current = String(
    data.current_state_summary || data.currentState || '',
  ).slice(0, 2000);

  // Optional capability hints — ids only; never trusted as evidence
  let hints = data.capability_hints || data.capabilityHints || [];
  if (!Array.isArray(hints)) hints = [];
  hints = hints
    .map((h) => {
      if (typeof h === 'string') return { name: slugId(h), why: '' };
      return {
        name: slugId(h.name || h.id || ''),
        why: String(h.why || '').slice(0, 400),
      };
    })
    .filter((h) => h.name)
    .slice(0, 12);

  return {
    ok: true,
    errors: [],
    current_state_summary: current || null,
    best_practice_summary: best || null,
    future_state_summary: future || null,
    capability_hints: hints,
    reasoning: String(data.reasoning || '').slice(0, 2000),
  };
}

/**
 * Verify multi-department review output.
 */
export function verifyDepartmentReview(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['not an object'], departments: [] };
  }
  let deps = data.departments || data.reviews || [];
  if (!Array.isArray(deps)) deps = [];
  deps = deps
    .map((d) => {
      const role = String(d.role || d.title || d.persona || '').trim();
      let findings = d.findings || d.notes || [];
      if (typeof findings === 'string') findings = [findings];
      if (!Array.isArray(findings)) findings = [];
      findings = findings.map((f) => String(f).slice(0, 300)).filter((f) => f.length > 5);
      if (!role || !findings.length) return null;
      return {
        persona: String(d.persona || d.id || slugId(role)).slice(0, 40),
        role: role.slice(0, 80),
        findings: findings.slice(0, 5),
      };
    })
    .filter(Boolean)
    .slice(0, 12);

  const consolidated = [
    ...new Set(deps.flatMap((d) => d.findings)),
  ].slice(0, 20);

  return {
    ok: deps.length >= 1,
    errors: deps.length ? [] : ['no valid departments'],
    departments: deps,
    consolidated_recommendations: consolidated,
    reasoning: String(data.reasoning || data.summary || '').slice(0, 2000),
  };
}

function normalizeDims(raw) {
  const keys = [
    'business_understanding',
    'requirements',
    'operations',
    'warehouse',
    'accounting',
    'reporting',
    'compliance',
    'overall',
  ];
  const out = {};
  for (const k of keys) {
    let v = raw[k];
    if (v == null && k === 'overall') v = raw.overall_score ?? raw.score;
    v = Number(v);
    if (Number.isNaN(v)) v = 0;
    // accept 0-100 or 0-1
    if (v > 1.5) v = v / 100;
    out[k] = Math.min(0.99, Math.max(0, Math.round(v * 100) / 100));
  }
  return out;
}

function slugId(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
}
