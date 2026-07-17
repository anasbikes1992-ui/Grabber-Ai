// health/monitor.js — System Health (sanctioned addition, EDR-001).
// Jarvis monitors ITSELF: platform observability, not client projects.

export class SystemHealth {
  constructor({ bus, telemetry, contextEngine }) {
    this.bus = bus;
    this.telemetry = telemetry;
    this.contextEngine = contextEngine;
  }

  snapshot() {
    const events = this.bus.replay();
    const gateFails = events.filter((e) => e.type === 'gate.failed').length;
    const gatePasses = events.filter((e) => e.type === 'gate.passed').length;
    const escalations = events.filter((e) => e.type === 'task.escalated').length;
    const policyTriggers = events.filter((e) => e.type === 'governance.policy_triggered').length;
    const m = this.telemetry.metrics();
    const bundles = [...this.contextEngine.bundles.values()];
    return {
      at: new Date().toISOString(),
      event_queue_depth: this.bus.depth,
      validation_failures: gateFails,
      gate_success_rate: gatePasses + gateFails ? gatePasses / (gatePasses + gateFails) : 1,
      escalations,
      policy_triggers: policyTriggers,
      avg_context_size_tokens: bundles.length
        ? Math.round(bundles.reduce((s, b) => s + JSON.stringify(b).length / 4, 0) / bundles.length)
        : 0,
      token_cost: m.token_cost,
      avg_latency_ms: m.avg_duration_ms,
      manual_intervention_rate: m.dispatches ? m.manual_interventions / m.dispatches : 0,
      // knowledge freshness & prompt drift wire in at Sprint 2 (Knowledge/Rule services)
      knowledge_freshness: 'n/a-until-sprint-2',
      prompt_drift: 'n/a-until-sprint-2',
    };
  }
}
