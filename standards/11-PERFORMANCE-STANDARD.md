# 11 — PERFORMANCE STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** all Building-layer agents, Performance validator

## 1. Scope

Runtime performance of every generated project: frontend delivery, backend
latency, database efficiency, and resource budgets.

## 2. Rules

**Budgets (declared, not implied)**
- PF-01 Every project MUST declare performance targets in the DNA file (`performance_targets`): page-load metrics, API latency percentiles, and payload budgets. Defaults when unstated: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, API p95 ≤ 400 ms.
- PF-02 Budgets MUST be enforced in CI (build fails on regression beyond declared tolerance), not observed manually.

**Frontend**
- PF-03 Initial JS payload MUST stay within the declared budget; code-splitting by route is the default.
- PF-04 Images/fonts MUST be optimized and lazily loaded below the fold (UI-07); render-blocking third-party scripts are prohibited without an EDR.
- PF-05 Caching headers and CDN strategy MUST be declared at the architecture stage.

**Backend & Data**
- PF-06 Every endpoint MUST declare its expected latency class; endpoints exceeding class p95 in load tests fail the gate.
- PF-07 Database queries MUST pass the index review (DB-12); unbounded queries (no limit on user-facing collections) are prohibited.
- PF-08 Expensive work (reports, exports, media processing) MUST be async jobs (AP-11), never inline in request handlers.
- PF-09 Caching layers, when introduced, MUST have declared invalidation rules — a cache without an invalidation rule fails review.

**Verification**
- PF-10 Load testing at declared expected traffic MUST run before the Deployment gate for projects whose DNA marks traffic-sensitive.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| PF-01–PF-02 budgets | DNA presence + CI enforcement | 25% |
| PF-03–PF-05 frontend | lab metrics vs budget | 30% |
| PF-06–PF-09 backend/data | load test + query analysis | 35% |
| PF-10 load test | pipeline artifact | 10% |

Gate threshold: **90%**.

## 4. Exceptions

Only via an Accepted EDR with a stated budget revision.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
