# 04 — API STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Backend worker, API validator, Documentation Factory

## 1. Scope

All APIs a generated project exposes or consumes: HTTP/REST by default;
GraphQL/RPC variants when an EDR selects them.

## 2. Rules

**Contract First**
- AP-01 Every API MUST have a machine-readable contract (OpenAPI or equivalent) generated from or validated against code — the contract and the code cannot drift.
- AP-02 Every endpoint MUST declare: auth requirement, input schema, output schema, error catalogue, and rate-limit class.
- AP-03 Breaking changes MUST bump a version and keep the previous version available per the deprecation window in the DNA file.

**Shape**
- AP-04 Resource naming MUST be consistent: plural nouns, kebab- or no-case paths chosen once per project, verbs only for actions that are not CRUD.
- AP-05 Responses MUST use a single envelope convention per project (declared in the DNA file), including a stable error shape: `code`, `message`, `details`, `trace_id`.
- AP-06 Pagination, filtering, and sorting MUST follow the project-declared convention on every collection endpoint — no bespoke variants.
- AP-07 Timestamps MUST be ISO-8601 UTC; money MUST be integer minor units + currency code.

**Behavior**
- AP-08 All input MUST be validated at the boundary (05-SECURITY S-04); validation failures return the standard error shape with field-level details.
- AP-09 Mutating endpoints MUST be idempotent or accept an idempotency key where retries are possible.
- AP-10 Every endpoint MUST enforce authn/authz per 06/07 standards; public endpoints are explicitly registered (05-SECURITY S-01).
- AP-11 Long-running operations MUST return a job resource, not hold the connection.

**Consumption**
- AP-12 Third-party API usage MUST go through an adapter (01-ARCHITECTURE AR-04) with declared timeout/retry/fallback (AR-12).

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| AP-01–AP-03 contract | contract diff + drift test | 30% |
| AP-04–AP-07 shape | contract lint | 25% |
| AP-08–AP-11 behavior | test suite + policy scan | 35% |
| AP-12 consumption | adapter scan | 10% |

Gate threshold: **90%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
