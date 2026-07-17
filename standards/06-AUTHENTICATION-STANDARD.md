# 06 — AUTHENTICATION STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Backend/Frontend workers, Security validator
**Relates to:** 05-SECURITY (S-01, S-09), 07-AUTHORIZATION

## 1. Scope

How users and services prove identity in every generated project: session
management, credentials, tokens, and account lifecycle.

## 2. Rules

**Mechanism**
- AN-01 Authentication MUST use a pattern from the Pattern Library (e.g., managed provider, OAuth/OIDC, session-cookie); hand-rolled crypto or session schemes are prohibited.
- AN-02 The chosen mechanism MUST be declared in the Project DNA file; changing it requires an EDR.
- AN-03 Passwords, when used, MUST be hashed with a modern adaptive algorithm (argon2/bcrypt class) via the platform's vetted library — never custom code.

**Sessions & Tokens**
- AN-04 Tokens MUST be short-lived with refresh rotation; refresh tokens are revocable server-side.
- AN-05 Session cookies MUST be HttpOnly, Secure, SameSite as declared; tokens MUST NOT be stored in localStorage.
- AN-06 Logout MUST invalidate server-side state, not just clear the client.

**Account Lifecycle**
- AN-07 Registration, verification, password reset, and account deletion flows MUST come from the Pattern Library and be present in every project with user accounts.
- AN-08 Reset/verification links MUST be single-use and expiring.
- AN-09 Authentication events (login, failure, reset, lockout) MUST be audit-logged (05-SECURITY S-13) without recording credentials.

**Hardening**
- AN-10 Login and reset endpoints MUST be rate-limited (05-SECURITY S-11) with lockout/backoff behavior declared in the DNA file.
- AN-11 MFA MUST be available for projects whose DNA `security_level` is elevated; it MAY be optional otherwise.
- AN-12 Service-to-service calls MUST authenticate with scoped, rotatable credentials — never shared user accounts.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| AN-01–AN-03 mechanism | pattern match + dependency scan | 30% |
| AN-04–AN-06 sessions | config inspection + tests | 30% |
| AN-07–AN-09 lifecycle | flow presence + audit-log tests | 25% |
| AN-10–AN-12 hardening | config + rate-limit tests | 15% |

Gate threshold: **98%**, zero critical findings.

## 4. Exceptions

Only via an Accepted EDR with a compensating control.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
