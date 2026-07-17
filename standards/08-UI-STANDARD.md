# 08 — UI STANDARD

**Status:** Approved · **Version:** 1.0.0
**Binds:** Frontend worker, UI validator, Design System stage (lifecycle 6)

## 1. Scope

Visual construction of every generated interface: design tokens, components,
layout, and states. Interaction behavior lives in 09-UX; accessibility in 10.

## 2. Rules

**Design System**
- UI-01 Every project MUST use a design token set (color, type scale, spacing, radius, elevation) declared at the Design System stage; hard-coded values in components are prohibited.
- UI-02 Components MUST come from the project's component library (seeded from `knowledge/components/`); one-off components require the library to be extended, not bypassed.
- UI-03 A component used in a second project MUST be proposed back to `knowledge/components/` (Rule 3).

**Construction**
- UI-04 Layout MUST be responsive across the breakpoints declared in the DNA file; fixed-pixel layouts fail validation.
- UI-05 Every data-bearing view MUST implement all five states: loading, empty, error, partial, and populated.
- UI-06 Every interactive element MUST have visible hover, focus, active, and disabled states from the token set.
- UI-07 Images MUST have explicit dimensions or aspect boxes (no layout shift) and use the project's optimization pipeline.

**Consistency**
- UI-08 Iconography, date/number formatting, and terminology MUST be consistent project-wide, driven by a single utilities module.
- UI-09 Dark mode / theming, when declared in the DNA file, MUST be token-driven — not per-component overrides.

## 3. Validation Rubric

| Check | Method | Weight |
|-------|--------|--------|
| UI-01–UI-03 design system | token/component scan | 35% |
| UI-04–UI-07 construction | automated viewport + state tests | 45% |
| UI-08–UI-09 consistency | lint + review rubric | 20% |

Gate threshold: **90%**.

## 4. Exceptions

Only via an Accepted EDR.

## 5. Changelog

- 1.0.0 (2026-07-15) — initial version.
