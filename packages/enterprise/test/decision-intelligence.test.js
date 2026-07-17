import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecommendation,
  explainRecommendation,
} from '../src/decision-intelligence.js';

test('recommendation includes provenance and explainable answers', () => {
  const rec = buildRecommendation({
    name: 'barcode_receiving',
    classification: 'recommended',
    industry: 'wholesale-distribution',
    clientAnswers: {
      receiving: 'Manual receive, frequent inventory errors',
    },
    playbookStatus: 'seed',
    graphHint: true,
    effort: 'medium',
  });

  assert.equal(rec.recommendation, 'Barcode Receiving');
  assert.ok(rec.confidence >= 0.85);
  assert.ok(rec.sources.some((s) => /Playbook/i.test(s)));
  assert.ok(rec.sources.some((s) => /Interview/i.test(s)));
  assert.ok(rec.business_impact.length >= 2);
  assert.equal(rec.required_or_optional, 'Recommended');
  assert.ok(rec.if_excluded.length > 10);

  const brief = explainRecommendation(rec);
  assert.ok(brief.confidence_pct >= 85);
  assert.ok(brief.explainable_answers.why);
  assert.ok(brief.explainable_answers.based_on.length >= 1);
});
