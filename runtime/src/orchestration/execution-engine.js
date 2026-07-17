// orchestration/execution-engine.js — the Execution Engine (docs/04 §3).
// Sequences, dispatches, records. Holds NO business intelligence (RT-02):
// stage logic lives in workflow definitions; rules live in standards.
// Agents are plain functions (bundle) => draft artifact — the full Agent
// Interface (initialize/loadContext/.../learn) arrives in Sprint 3 (EDR-001).

export class ExecutionEngine {
  constructor({ bus, registry, machine, context, validation, policy, telemetry, workflows, agents }) {
    Object.assign(this, { bus, registry, machine, context, validation, policy, telemetry, workflows, agents });
  }

  /**
   * Derive and run the current stage's tasks (RT-01: replayable — the task
   * list is a pure function of stage + workflow config + DNA).
   */
  runStage(projectId) {
    const stage = this.machine.stageOf(projectId);
    if (stage === 'deployment') {
      const blocking = this.policy.isBlocked(projectId, 'deploy');
      if (blocking) throw new Error(`deployment blocked by policy ${blocking} (Policy Engine)`);
    }
    const workflow = this.workflows[stage];
    if (!workflow) throw new Error(`no workflow defined for stage "${stage}" (RT-02: the engine cannot improvise stage logic)`);

    const results = [];
    for (const task of workflow.tasks) {
      results.push(this.#runTask(projectId, stage, task, workflow));
    }

    // Stage gate: aggregate of task validations (01-OS §3 via stage config).
    const scores = results.map((r) => r.score);
    const stageScore = Math.min(...scores);
    if (results.every((r) => r.passed)) {
      const next = this.machine.gatePassed(projectId, stage, { score: stageScore });
      return { stage, passed: true, score: stageScore, next, results };
    }
    const corrections = results.flatMap((r) => r.corrections);
    const outcome = this.machine.gateFailed(projectId, stage, { score: stageScore, corrections });
    return { stage, passed: false, score: stageScore, outcome, corrections, results };
  }

  #runTask(projectId, stage, task, workflow) {
    const started = Date.now();
    const project = { dna: this.machine.projectDna?.(projectId) ?? task.dnaSections };
    this.bus.emit({ type: 'task.created', project: projectId, stage, subject: task.name, actor: 'execution-engine' });

    // 1. Context Engine builds the bundle (docs/04 §3 step order).
    const bundle = this.context.assemble({
      task: { type: task.name },
      agent: task.agent,
      dnaSections: task.dnaSections,
      constraints: task.constraints,
      standards: task.standards,
      knowledge: task.knowledge ?? [],
      decisions: task.decisions ?? [],
      artifacts: (task.inputs ?? []).filter((id) => this.registry.consumable(id)), // AM-01
      outputContract: { type: task.outputType },
      budgetTokens: task.budgetTokens ?? 100_000,
    });
    this.bus.emit({ type: 'task.dispatched', project: projectId, stage, subject: task.name, actor: 'execution-engine', payload: { agent: task.agent, bundle: bundle.id } });

    // 2. Agent Runtime executes: (context bundle) → output artifact (AG-01/AG-03).
    const agent = this.agents[task.agent];
    if (!agent) throw new Error(`unknown agent "${task.agent}"`);
    const output = agent(bundle);

    // 3. Artifact Registry receives the output (envelope enforced on write).
    const artifactId = this.registry.put({
      ...output,
      project: projectId,
      stage,
      producer: {
        agent: task.agent,
        prompt_version: task.promptVersion ?? '1.0.0',
        standards_version: bundle.provenance.standards_version,
        context_bundle: bundle.id, // CE-06
      },
    });

    // 4. Validation Runtime scores it (docs/04 §6).
    const threshold = workflow.gateThreshold ?? 90;
    const report = this.validation.validate(artifactId, { applicable: workflow.applicableSteps, threshold });
    if (report.passed) this.registry.approve(artifactId, 'execution-engine');

    // 5. Telemetry (OB-09).
    this.telemetry.record({ kind: 'dispatch', project: projectId, task: task.name, agent: task.agent, bundle: bundle.id, route: task.route ?? 'default', tokens: Math.ceil(JSON.stringify(bundle).length / 4), durationMs: Date.now() - started });
    this.telemetry.record({ kind: 'validation', project: projectId, task: task.name, score: report.score });
    this.bus.emit({ type: report.passed ? 'task.completed' : 'task.failed', project: projectId, stage, subject: task.name, actor: 'execution-engine', payload: { artifact: artifactId, score: report.score } });

    return { task: task.name, artifactId, passed: report.passed, score: report.score, corrections: report.corrections };
  }
}
