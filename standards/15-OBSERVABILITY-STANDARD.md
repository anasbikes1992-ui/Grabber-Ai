# 15 — OBSERVABILITY STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Backend/DevOps workers, Deployment validator
**Relates to:** 14-DEVOPS (DO-09), 16-ERROR-HANDLING

## 1. Scope

Logging, metrics, tracing, and alerting for every deployed project — plus the
platform's own AI-pipeline observability.

## 2. Rules

**Logging**
- OB-01 Logs MUST be structured (JSON-class), leveled, and carry a correlation/trace id propagated across services (AP-05 `trace_id`).
- OB-02 Logs MUST NOT contain secrets, credentials, tokens, or personal data beyond the DNA file's declared allowance (S-09, DB-11).
- OB-03 Security-relevant events follow the audit-log rules (S-13); audit logs are append-only and separately retained.

**Metrics & Tracing**
- OB-04 Every service MUST expose the four golden signals: latency, traffic, errors, saturation.
- OB-05 Performance budgets (11-PERFORMANCE PF-01) MUST have corresponding production metrics — a budget without a metric is unenforceable and fails review.
- OB-06 Distributed tracing MUST cover every external call and job queue for projects with more than one service.

**Alerting**
- OB-07 Every project MUST go live with an alert set: error-rate, latency-budget breach, saturation, and uptime — each with a runbook link (DC-03).
- OB-08 Alerts MUST be actionable; an alert with no documented response is deleted or fixed. Alert fatigue findings feed the Learning Engine.

**Platform (AI-Pipeline) Observability**
- OB-09 Every pipeline run MUST record: routing decisions, gate scores, token cost, duration, and human interventions (01-OPERATING-SYSTEM §6 AI metrics).
- OB-10 Every agent output MUST be traceable to: prompt version, standards version, knowledge entries consulted, and EDRs referenced — full provenance, no anonymous artifacts.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| OB-01–OB-03 logging | log scan + PII test | 30% |
| OB-04–OB-06 metrics/tracing | endpoint + trace inspection | 25% |
| OB-07–OB-08 alerting | alert-set + runbook presence | 25% |
| OB-09–OB-10 platform | pipeline metadata audit | 20% |

Gate threshold: **95%** (required for the 100% Deployment gate, DO-09).

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
