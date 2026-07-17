# 09 — UX STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** UX Designer (Thinking layer), Frontend worker, UX validator

## 1. Scope

Interaction behavior of every generated interface: flows, feedback, errors,
and content. Visual construction lives in 08-UI; accessibility in 10.

## 2. Rules

**Flows**
- UX-01 Every user-facing feature MUST have its primary flow documented (entry → steps → success/failure exits) at the Design System stage before implementation.
- UX-02 Destructive actions MUST require confirmation proportional to impact and be undoable where feasible.
- UX-03 Multi-step processes MUST show progress, preserve entered data across steps, and survive refresh where declared.

**Feedback**
- UX-04 Every user action MUST produce feedback within 100 ms (optimistic or progress indication); operations > 1 s show determinate progress where possible.
- UX-05 Error messages MUST say what happened, why (when known), and what the user can do — never raw codes or stack traces (16-ERROR-HANDLING EH-07).
- UX-06 Empty states MUST guide the next action, not just state absence.

**Forms**
- UX-07 Validation MUST be inline, on the field, at the earliest sensible moment; submit-time-only validation fails review.
- UX-08 Forms MUST preserve input on error and mark required vs optional consistently.

**Content**
- UX-09 Microcopy MUST use the project's declared voice (DNA file) and terminology module (UI-08); mixed terminology fails review.
- UX-10 Every page MUST have a clear primary action; competing primary actions fail review.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| UX-01–UX-03 flows | flow-doc presence + walkthrough tests | 35% |
| UX-04–UX-06 feedback | interaction tests | 30% |
| UX-07–UX-08 forms | automated form tests | 20% |
| UX-09–UX-10 content | reviewer agent rubric | 15% |

Gate threshold: **90%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
