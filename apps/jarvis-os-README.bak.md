# Jarvis OS (Phase 3)

**Flagship product experience** for Grabber AI Studio.

```
Grabber Core (engine, FROZEN)
        ↑
   Product Factory (manufacturing)
        ↑
     Jarvis OS (this app — intelligence + UX)
        ↑
  Commercial Products
```

## What Jarvis OS is

- The **operating system** experience for the software factory
- Premium, motion-rich command center (not a CRUD admin theme)
- Consumer of Grabber Core + Product Factory APIs only

## What Jarvis OS is NOT

- A second orchestrator
- A second runtime
- A redesign of Grabber Core

## Phase 3 scope (planned)

- Design system (dark graphite / glass / cyan-purple)
- Layout: Command bar · Sidebar · Workspace · AI Hub · Timeline
- Views: Dashboard, Factory, DNA Explorer, Modules, Blueprints, Deployments, Analytics
- Motion: Framer Motion; graphs: React Flow; optional 3D: R3F later

## Current state

Scaffold only. Factory host remains `apps/saas-starter` until Jarvis surfaces are migrated.

## Consume (do not reimplement)

| Capability | Source |
|------------|--------|
| Build / regenerate | Product Factory + Core builders |
| DNA / intake | `saas-starter` intake + intelligence APIs |
| Modules / blueprints | Factory Registry v2 |
| Metrics | Factory analytics API |
| Deploy plans | Integration layer |

## Stack (target)

Next.js 15 · React 19 · TypeScript · Tailwind 4 · shadcn · Framer Motion · React Flow · Lucide

## Governance

Track B product. No Core changes. Wall KPI unchanged: DNA → validated production app.
