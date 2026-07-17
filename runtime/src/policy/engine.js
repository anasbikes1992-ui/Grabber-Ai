// policy/engine.js — Policy Engine (sanctioned addition, EDR-001).
// Enterprise governance: declarative if/then rules evaluated on events.
// Policies do not replace standards — they act on runtime signals.

export class PolicyEngine {
  #policies = new Map();
  #blocks = new Map(); // `${project}:${action}` -> policyId
  #issues = [];

  constructor(bus) {
    this.bus = bus;
    bus.subscribe('*', 'policy-engine', (event) => this.evaluate(event));
  }

  /**
   * @param {{id:string, description:string, appliesTo:string, condition:(event)=>boolean,
   *          actions:Array<{type:'block'|'notify'|'open_issue'|'create_edr', target?:string, action?:string}>,
   *          severity:'info'|'warning'|'critical', recovery:string, owner:string}} policy
   */
  register(policy) {
    for (const k of ['id', 'description', 'appliesTo', 'condition', 'actions', 'severity', 'recovery', 'owner']) {
      if (policy[k] === undefined) throw new Error(`policy.${k} required`);
    }
    this.#policies.set(policy.id, policy);
  }

  evaluate(event) {
    for (const policy of this.#policies.values()) {
      if (policy.appliesTo !== event.type && policy.appliesTo !== '*') continue;
      if (!policy.condition(event)) continue;
      for (const action of policy.actions) {
        if (action.type === 'block') this.#blocks.set(`${event.project}:${action.action}`, policy.id);
        if (action.type === 'open_issue') this.#issues.push({ policy: policy.id, project: event.project, event: event.id, target: action.target });
        // 'notify' and 'create_edr' surface through the governance event below.
      }
      this.bus.emit({
        type: 'governance.policy_triggered',
        project: event.project, stage: event.stage,
        subject: event.id, actor: 'policy-engine',
        causationId: event.id, correlationId: event.correlation_id,
        payload: { policy: policy.id, severity: policy.severity, actions: policy.actions.map((a) => a.type), recovery: policy.recovery, owner: policy.owner },
      });
    }
  }

  /** Consulted by the Execution Engine before privileged actions. */
  isBlocked(project, action) {
    return this.#blocks.get(`${project}:${action}`) ?? null;
  }

  unblock(project, action, actor) {
    // Exceptions only via governance (Article VII.3 analog for policies).
    const policyId = this.#blocks.get(`${project}:${action}`);
    if (!policyId) return;
    this.#blocks.delete(`${project}:${action}`);
    this.bus.emit({ type: 'gate.exception_granted', project, actor, payload: { action, policy: policyId } });
  }

  get openIssues() { return [...this.#issues]; }
}

/** The canonical example policy from EDR-001. */
export const securityDeploymentPolicy = {
  id: 'POL-001-security-blocks-deployment',
  description: 'If security score < 95, deployment is blocked; notify Security Agent, open issue, create EDR.',
  appliesTo: 'gate.failed',
  condition: (e) => e.stage === 'security' || (e.stage === 'deployment' && (e.payload?.score ?? 100) < 95),
  actions: [
    { type: 'block', action: 'deploy' },
    { type: 'notify', target: 'security-agent' },
    { type: 'open_issue', target: 'security' },
    { type: 'create_edr' },
  ],
  severity: 'critical',
  recovery: 'Remediate findings, re-run security gate; unblock requires gate.passed at threshold.',
  owner: 'Security',
};
