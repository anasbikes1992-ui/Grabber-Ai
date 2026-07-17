# STANDARDS INDEX (Phase 3) — The Constitution

**Status:** Complete · **Version:** 2.0.0

Standards come **before** agents and prompts. They are the constitution of
Grabber AI Studio: every agent spec lists the standards that bind it,
validators score against these documents, and the Prompt OS assembles prompts
from them (18-PROMPT PR-01). Agents are replaceable — standards are not.

| # | Standard | File | Gate | Status |
|---|----------|------|------|--------|
| 01 | Architecture | `01-ARCHITECTURE-STANDARD.md` | 90% | ✅ 1.0.0 |
| 02 | Coding | `02-CODING-STANDARD.md` | 90% | ✅ 1.0.0 |
| 03 | Database | `03-DATABASE-STANDARD.md` | 95% | ✅ 1.0.0 |
| 04 | API | `04-API-STANDARD.md` | 90% | ✅ 1.0.0 |
| 05 | Security | `05-SECURITY-STANDARD.md` | 98% | ✅ 1.0.0 |
| 06 | Authentication | `06-AUTHENTICATION-STANDARD.md` | 98% | ✅ 1.0.0 |
| 07 | Authorization | `07-AUTHORIZATION-STANDARD.md` | 98% | ✅ 1.0.0 |
| 08 | UI | `08-UI-STANDARD.md` | 90% | ✅ 1.0.0 |
| 09 | UX | `09-UX-STANDARD.md` | 90% | ✅ 1.0.0 |
| 10 | Accessibility | `10-ACCESSIBILITY-STANDARD.md` | 95% | ✅ 1.0.0 |
| 11 | Performance | `11-PERFORMANCE-STANDARD.md` | 90% | ✅ 1.0.0 |
| 12 | Testing | `12-TESTING-STANDARD.md` | 95% | ✅ 1.0.0 |
| 13 | Documentation | `13-DOCUMENTATION-STANDARD.md` | 90% | ✅ 1.0.0 |
| 14 | DevOps | `14-DEVOPS-STANDARD.md` | 100% | ✅ 1.0.0 |
| 15 | Observability | `15-OBSERVABILITY-STANDARD.md` | 95% | ✅ 1.0.0 |
| 16 | Error Handling | `16-ERROR-HANDLING-STANDARD.md` | 90% | ✅ 1.0.0 |
| 17 | Git | `17-GIT-STANDARD.md` | 95% | ✅ 1.0.0 |
| 18 | Prompt | `18-PROMPT-STANDARD.md` | 95% | ✅ 1.0.0 |

Naming conventions are embedded in 02-CODING (CO-05), 03-DATABASE (DB-03),
and 04-API (AP-04) rather than a separate standard — one home per rule (Rule 1).

## Required format for every standard

1. **Scope** — what it governs
2. **Rules** — numbered, testable statements (MUST/SHOULD/MAY per RFC 2119), each with a prefix code (AR-, CO-, DB-, AP-, S-, AN-, AZ-, UI-, UX-, AC-, PF-, TS-, DC-, DO-, OB-, EH-, GT-, PR-)
3. **Validation rubric** — how validators score compliance (feeds gates, 01-OPERATING-SYSTEM §3)
4. **Exceptions** — only via an Accepted EDR
5. **Changelog**

A rule that can't be checked by a validator doesn't belong in a standard —
it belongs in a playbook.

## Versioning

Standards follow semantic versioning (17-GIT GT-07). A major bump triggers
re-validation of every agent, prompt, and template that lists the standard as
a dependency (tracked in the Capability Registry).
