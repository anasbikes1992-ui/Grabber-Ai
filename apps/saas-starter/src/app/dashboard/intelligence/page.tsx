import { IntelligencePanel } from "@/components/intelligence-panel";

export default function IntelligencePage() {
  return (
    <div data-testid="intelligence-page">
      <h1 className="text-2xl font-semibold tracking-tight">
        Product Intelligence
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Sprint 2 layer: client request → discovery → requirements → Project DNA
        → builder job handoff for{" "}
        <strong>Grabber Core</strong>. This app does not run its own
        orchestrator.
      </p>
      <div className="mt-8">
        <IntelligencePanel />
      </div>
    </div>
  );
}
