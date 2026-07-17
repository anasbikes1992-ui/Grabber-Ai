# 16 — ERROR-HANDLING STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** all Building-layer agents, Code validator
**Relates to:** 04-API (AP-05), 09-UX (UX-05), 15-OBSERVABILITY

## 1. Scope

How every generated project detects, classifies, reports, and recovers from
errors — application and pipeline alike.

## 2. Rules

**Classification**
- EH-01 Every project MUST use a single error taxonomy: `validation`, `auth`, `not_found`, `conflict`, `rate_limited`, `upstream`, `internal` — extended only via EDR.
- EH-02 Errors MUST be typed/structured at the point of origin; string-only errors fail review.

**Handling**
- EH-03 Errors are handled at the boundary that can act on them; intermediate layers propagate with context, they don't swallow (CO-12).
- EH-04 Silent catches, empty catch blocks, and catch-log-continue without classification are prohibited.
- EH-05 Every external call MUST map upstream failures into the taxonomy with declared timeout/retry/fallback (AR-12); retries MUST be bounded with backoff and idempotency safety (AP-09).
- EH-06 Partial failure in batch operations MUST be reported per item, never as silent partial success.

**Surfaces**
- EH-07 User-facing errors follow UX-05 (what happened, why, what to do); internal detail and stack traces never reach the client (API shape per AP-05).
- EH-08 All `internal` and `upstream` errors MUST be logged with correlation id (OB-01) and counted in error-rate metrics (OB-04).

**Recovery**
- EH-09 Crash recovery MUST be defined per service: process supervision, queue redelivery semantics, and idempotent handlers for at-least-once delivery.
- EH-10 Data-changing operations that can fail midway MUST be transactional or compensated; declared in the architecture doc.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| EH-01–EH-02 classification | static analysis | 20% |
| EH-03–EH-06 handling | static analysis + fault-injection tests | 40% |
| EH-07–EH-08 surfaces | API tests + log inspection | 20% |
| EH-09–EH-10 recovery | architecture doc + chaos checks | 20% |

Gate threshold: **90%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
