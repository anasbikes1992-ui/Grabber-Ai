import { IntakeWizard } from "@/components/intake-wizard";

export default function IntakePage() {
  return (
    <div data-testid="intake-page">
      <h1 className="text-2xl font-semibold tracking-tight">Client intake</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Sprint 3 produces <strong>Project DNA</strong> — conversation →
        structured understanding → confidence-gated review → Grabber Core. The
        wizard is one interface over a deterministic pipeline.
      </p>
      <div className="mt-8">
        <IntakeWizard />
      </div>
    </div>
  );
}
