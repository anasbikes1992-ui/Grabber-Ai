// validation/runtime.js — Validation Runtime (docs/04 §6).
// Executes the constitutional sequence on every artifact; produces scores,
// per-rule pass/fail, and structured correction lists (VR-02) — never prose.

export const SEQUENCE = [
  'syntax', 'standards', 'architecture', 'security',
  'performance', 'accessibility', 'documentation', 'completion',
];

export class ValidationRuntime {
  #rubrics = new Map(); // step -> (artifact, ctx) => {score, findings:[{rule, passed, correction?}]}

  constructor(bus, registry) {
    this.bus = bus;
    this.registry = registry;
  }

  /** Rubrics are published in /standards; registered here per step (VR-01). */
  register(step, rubricFn) {
    if (!SEQUENCE.includes(step)) throw new Error(`unknown validation step "${step}"`);
    this.#rubrics.set(step, rubricFn);
  }

  /**
   * Run the eight-step sequence. Steps without a registered rubric are
   * skipped ONLY if the stage config marks them non-applicable; otherwise
   * they count as unscored (fail) — no silent passes.
   */
  validate(artifactId, { applicable = SEQUENCE, threshold, actor = 'validation-runtime' } = {}) {
    const artifact = this.registry.get(artifactId);
    const steps = [];
    const corrections = [];
    for (const step of SEQUENCE) {
      if (!applicable.includes(step)) continue;
      const rubric = this.#rubrics.get(step);
      if (!rubric) {
        steps.push({ step, score: 0, error: 'no rubric registered — unscored behavior may not be relied on (Article IX.3)' });
        corrections.push({ step, rule: 'meta', correction: `register a rubric for "${step}"` });
        continue;
      }
      const { score, findings = [] } = rubric(artifact);
      steps.push({ step, score, findings });
      for (const f of findings) {
        if (!f.passed) corrections.push({ step, rule: f.rule, correction: f.correction ?? `satisfy ${f.rule}` });
      }
      if (step === 'security' && findings.some((f) => !f.passed && f.severity === 'critical')) {
        // Article VIII.2: a critical security finding blocks regardless of score.
        return this.#report(artifact, { passed: false, score: 0, steps, corrections, actor, blockedBy: 'critical security finding' });
      }
    }
    const scored = steps.filter((s) => !s.error);
    const score = scored.length ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / steps.length) : 0;
    const passed = steps.every((s) => !s.error) && score >= threshold;
    return this.#report(artifact, { passed, score, steps, corrections, actor });
  }

  #report(artifact, { passed, score, steps, corrections, actor, blockedBy = null }) {
    // VR-04: the report is itself an artifact, attached permanently.
    const reportId = this.registry.put({
      type: 'report.validation',
      project: artifact.project,
      stage: artifact.stage,
      producer: { agent: actor, prompt_version: 'n/a', standards_version: artifact.producer.standards_version, context_bundle: artifact.producer.context_bundle },
      inputs: [artifact.id],
      outputs_declared: [],
      dependencies: [artifact.id],
      related_standards: steps.flatMap((s) => (s.findings ?? []).map((f) => f.rule)),
      related_edrs: [],
      derives_from: ['validation-of:' + artifact.id],
      content: { passed, score, steps, corrections, blockedBy },
    });
    this.registry.attachValidation(artifact.id, { passed, score, reportId });
    return { passed, score, corrections, reportId, blockedBy };
  }
}
