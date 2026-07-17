# 05 — SECURITY STANDARD (Exemplar)

**Status:** Approved · **Version:** 1.0.0
**Binds:** all Building-layer agents, Security validator, Deployment pipeline

This is the exemplar standard — it defines the format all standards follow.

---

## 1. Scope

All application code, infrastructure configuration, and pipelines produced by
the platform. Security is a rule, not a phase (01 §8): no pipeline reaches the
Deployment gate without passing this standard's rubric.

## 2. Rules

**Authentication & Authorization**
- S-01 Every endpoint MUST enforce authentication unless explicitly registered as public in the project spec.
- S-02 Authorization MUST be enforced server-side; client-side checks are advisory only.
- S-03 Database access MUST use row-level security (RLS) or an equivalent policy layer; every table's policy MUST be declared in the data architecture (stage 7).

**Input & Output**
- S-04 All external input MUST be validated against a schema at the boundary.
- S-05 SQL MUST use parameterized queries; string-built SQL is prohibited.
- S-06 Output encoding MUST prevent XSS; templates auto-escape by default.
- S-07 State-changing requests MUST carry CSRF protection.
- S-08 Server-side fetches of user-supplied URLs MUST pass an SSRF allowlist.

**Secrets & Dependencies**
- S-09 Secrets MUST never appear in code, logs, or version control; secret scanning runs on every commit.
- S-10 Dependencies MUST pass vulnerability scanning; severity ≥ high blocks the gate.

**Operational**
- S-11 Public endpoints MUST have rate limiting.
- S-12 Responses MUST set secure headers (CSP, HSTS, X-Content-Type-Options, frame-ancestors).
- S-13 Security-relevant events (auth, privilege change, data export) MUST be audit-logged.
- S-14 Every project MUST pass the OWASP Top 10 automated suite before Deployment.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| S-01–S-03 auth/authz/RLS | policy scan + test suite | 30% |
| S-04–S-08 input/output | static analysis + injected test cases | 25% |
| S-09–S-10 secrets/deps | secret scanner + dependency audit | 20% |
| S-11–S-13 operational | config inspection | 15% |
| S-14 OWASP suite | automated scan | 10% |

Gate threshold: **98%**, and **zero critical findings** regardless of score.

## 4. Exceptions

Only via an Accepted Decision Record naming the rule, the compensating
control, and a review trigger. Exceptions expire; they are re-validated at
every deployment.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version, exemplar for standard format.
