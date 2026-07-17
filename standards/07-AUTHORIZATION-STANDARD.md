# 07 — AUTHORIZATION STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Backend/Database workers, Security validator
**Relates to:** 05-SECURITY (S-02, S-03), 06-AUTHENTICATION, 03-DATABASE (DB-06)

## 1. Scope

Who may do what, once identity is established: roles, permissions, policy
enforcement, and multi-tenancy isolation.

## 2. Rules

**Model**
- AZ-01 Every project MUST declare its authorization model (RBAC, ABAC, or hybrid) and its role/permission matrix in the Project DNA file before development.
- AZ-02 Permissions MUST be checked against actions and resources, not UI routes; hiding a button is never an authorization control.
- AZ-03 The default posture MUST be deny; every allow is explicit.

**Enforcement**
- AZ-04 Authorization MUST be enforced server-side at the service layer AND at the data layer (RLS per DB-06) — defense in depth, both mandatory.
- AZ-05 Multi-tenant projects MUST enforce tenant isolation at the data layer; tenant id filtering in application code alone fails validation.
- AZ-06 Privilege escalation paths (role assignment, permission grants) MUST themselves be permission-guarded and audit-logged.
- AZ-07 Object-level checks MUST verify ownership/tenancy on every read and write of user-owned resources (prevents IDOR/BOLA).

**Administration**
- AZ-08 Admin capabilities MUST be separated from user capabilities by role, surface, and audit trail — never a boolean flag on the user record alone.
- AZ-09 Role/permission changes MUST take effect without redeploy and be reflected in revoked sessions/tokens within the declared window.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| AZ-01–AZ-03 model | DNA matrix presence + policy review | 25% |
| AZ-04–AZ-07 enforcement | policy scan + IDOR test suite | 50% |
| AZ-08–AZ-09 administration | flow inspection + tests | 25% |

Gate threshold: **98%**, zero critical findings.

## 4. Exceptions

Only via an Accepted EDR with a compensating control.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
