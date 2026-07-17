import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLlmAvailable, llmStatus, callModel } from '../src/llm.js';
import {
  verifyDiscoveryOutput,
  verifyDepartmentReview,
  verifyGapEnrichment,
} from '../src/verifier.js';

test('LLM disabled without key — fallback path', async () => {
  const prev = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  process.env.GRABBER_LLM = '0';
  assert.equal(isLlmAvailable(), false);
  const st = llmStatus();
  assert.equal(st.available, false);
  const res = await callModel({
    system: 'test',
    user: 'hello',
    schemaHint: '{}',
  });
  assert.equal(res.ok, false);
  assert.equal(res.fallback, true);
  if (prev !== undefined) process.env.ANTHROPIC_API_KEY = prev;
  delete process.env.GRABBER_LLM;
});

test('verifier caps inflated discovery confidence', () => {
  const v = verifyDiscoveryOutput(
    {
      next_questions: [{ id: 'q1', prompt: 'How do you reconcile roll weight to meters sold?' }],
      confidence_dimensions: { overall: 0.99, operations: 0.9 },
      reasoning: 'thin data',
    },
    { answeredCount: 2, deterministicOverall: 0.3 },
  );
  assert.equal(v.ok, true);
  assert.ok(v.confidence_dimensions.overall <= 0.55);
  assert.ok(v.next_questions.length >= 1);
});

test('verifier accepts department review', () => {
  const v = verifyDepartmentReview({
    departments: [
      {
        role: 'Finance Consultant',
        findings: ['Add landed cost for true inventory valuation'],
      },
    ],
  });
  assert.equal(v.ok, true);
  assert.ok(v.consolidated_recommendations.length >= 1);
});

test('verifier gap enrichment shapes narratives', () => {
  const v = verifyGapEnrichment({
    future_state_summary: 'Barcode receiving and credit limits first.',
    capability_hints: [{ name: 'barcode_receiving', why: 'Error reduction' }],
  });
  assert.equal(v.ok, true);
  assert.ok(v.future_state_summary.includes('Barcode'));
});
