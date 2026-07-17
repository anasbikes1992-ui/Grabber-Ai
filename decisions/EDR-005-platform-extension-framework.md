# EDR-005 — Platform Extension Framework (v1.6)

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Owner** | Anaz |
| **Date** | 2026-07-15 |
| **Project** | platform |
| **Stage** | architecture |

## Context
v1.5 completed Platform Infrastructure. Architecture is proven. The bottleneck
is no longer core correctness — it is **developer experience** and **stable
extension points** so the platform can grow without modifying Grabber AI
Studio Core.

Naming shift: the platform core is **Grabber AI Studio Core**. Jarvis is an
application (orchestration brain) that runs **on** the core, not the core
itself (docs/02 remains historical; new work targets Core APIs).

## Problem
Ship SDK + plugins as one-offs, or ship a unified extension framework?

## Alternatives
1. SDK only — rejected: extensions still need a runtime lifecycle.
2. Ad-hoc plugin folders — rejected: diverges per type.
3. **Platform Extension Framework** — chosen: one lifecycle, many extension
   types, shared SDKs, CLI as primary DX surface.

## Decision
1. **v1.6 name:** Platform Extension Framework (not merely “SDK + Plugin Runtime”).
2. **Packages:**
   ```
   packages/common, sdk, plugin-sdk, connector-sdk, skill-sdk,
   workflow-sdk, template-sdk, agent-sdk
   packages/cli → grabber
   ```
3. **Extension types:** plugin, connector, skill, workflow, template,
   knowledge-pack, agent, policy, validator. All share lifecycle:
   Discover → Load → Validate → Initialize → Register → Activate → Monitor → Unload.
4. **Connectors stay thin:** auth, transport, subscribe, transfer, webhooks only.
5. **Skills (first-party):** ship **manifests for 20** platform skills (not full
   implementations of 100). Full action bodies land with Development Factory.
6. **Templates:** framework support only; three production templates (SaaS,
   CRM, Marketplace) are v1.8+ deliverables.
7. **Docs lag implementation:** new architecture docs only when implementation
   exposes a gap. EDRs + package READMEs are sufficient for v1.6.
8. **@grabber/sdk** is the only sanctioned consumer contract for Foundation
   APIs (wraps runtime services; no private imports from extensions).

## Trade-offs
Skill actions are stubs/manifest-first — accepted so the framework stabilizes
before domain depth.

## Consequences
- Core freezes extension surface at packages/* + runtime/src/extensions.
- Agent Runtime (v1.7) builds on agent-sdk + same lifecycle.
- Third-party extensions must pass manifest validation.

## Related Standards
AP-05, CO-05, OB-09, Article II.

## Related Components
packages/*, runtime/src/extensions/*, skills/*, packages/cli.

## Review Trigger
v1.6 done when: extension lifecycle tested, SDK clients cover Foundation APIs,
CLI commands green, 20 first-party skill manifests present, MASTER → 1.6.0.
