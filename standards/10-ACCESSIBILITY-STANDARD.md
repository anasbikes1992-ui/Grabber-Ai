# 10 — ACCESSIBILITY STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Frontend worker, Accessibility validator
**Baseline:** WCAG 2.1 AA (or the level declared in the Project DNA `accessibility_level`)

## 1. Scope

Every generated interface. Accessibility is validated per feature, not as a
final pass.

## 2. Rules

- AC-01 Every project MUST declare its target level in the DNA file; the default is WCAG 2.1 AA and MAY only be lowered by an EDR with client sign-off.
- AC-02 All functionality MUST be operable by keyboard alone; focus order follows visual order; no focus traps.
- AC-03 Focus MUST be visible (UI-06) and managed on route change, dialog open/close, and dynamic content insertion.
- AC-04 Semantic HTML MUST be preferred; ARIA is a supplement, never a substitute — and every ARIA usage matches a pattern from `knowledge/components/`.
- AC-05 Text contrast MUST meet the declared level's ratios; contrast is token-enforced (UI-01), not per-component.
- AC-06 Every image MUST have appropriate alt text (or empty alt for decorative); every form control a programmatic label; every page a unique title and landmark structure.
- AC-07 Content MUST remain usable at 200% zoom and with reduced-motion preference respected.
- AC-08 Live/dynamic updates (toasts, validation, async results) MUST be announced to assistive tech.
- AC-09 Media MUST have captions/transcripts when the DNA file declares media features.
- AC-10 Automated a11y scans MUST run in CI on every merge; violations at the declared level block the gate.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| AC-02–AC-03 keyboard/focus | automated + scripted walkthrough | 30% |
| AC-04–AC-06 semantics/contrast/labels | axe-class scanner | 40% |
| AC-07–AC-09 zoom/motion/media | viewport + preference tests | 15% |
| AC-10 CI integration | pipeline check | 15% |

Gate threshold: **95%** at declared level; zero critical violations.

## 4. Exceptions

Only via an Accepted EDR with client sign-off and a remediation date.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
