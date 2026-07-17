# 01 — ARCHITECTURE STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** System Architect, all Building-layer agents, Architecture validator

## 1. Scope

System design of every generated project: structure, boundaries, dependencies,
technology selection, and architectural documentation.

## 2. Rules

**Structure & Boundaries**
- AR-01 Every project MUST declare its architecture style (layered, modular monolith, services) in the Project DNA file before development starts.
- AR-02 Modules MUST communicate through declared interfaces; cross-module imports of internals are prohibited.
- AR-03 Business logic MUST NOT live in UI components or route handlers; it lives in a dedicated domain/service layer.
- AR-04 External services (payments, email, storage) MUST be wrapped behind adapters so vendors are swappable (Rule 2 of MASTER).
- AR-05 Every project MUST have exactly one source of configuration, environment-driven, with a checked-in schema of required variables.

**Technology Selection**
- AR-06 Stack choice MUST follow the technology decision rules (01-OPERATING-SYSTEM §7); deviations require an Accepted EDR.
- AR-07 New dependencies MUST be justified against an existing pattern in the Pattern Library; if none exists, an EDR records why.
- AR-08 No architectural decision MAY rely on undocumented behavior of a framework or model.

**Documentation**
- AR-09 Every project MUST ship an architecture document containing: context diagram, module map, data flow, integration list, and links to its EDRs.
- AR-10 Every significant architectural choice MUST have an EDR (templates/DECISION-RECORD-TEMPLATE.md) before implementation begins.
- AR-11 The architecture document MUST be regenerated (not hand-patched) when the Project DNA file changes.

**Resilience**
- AR-12 Every external call MUST define timeout, retry, and failure behavior.
- AR-13 Every project MUST define its rollback strategy before the Deployment gate.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| AR-01–AR-05 boundaries/config | structure scan + review | 35% |
| AR-06–AR-08 technology | decision-rule match + EDR presence | 25% |
| AR-09–AR-11 documentation | artifact presence + freshness vs DNA | 25% |
| AR-12–AR-13 resilience | config inspection | 15% |

Gate threshold: **90%** (01-OPERATING-SYSTEM §3).

## 4. Exceptions

Only via an Accepted EDR naming the rule, the compensating approach, and a
review trigger.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
