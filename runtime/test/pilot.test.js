// Pilot acceptance (EDR-003): the platform-wide success metric.
// "Can a brand-new Project DNA file travel through the runtime, produce
// validated artifacts, satisfy all policies, and result in a deployable
// application with minimal manual intervention?"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPilot } from '../pilot/pilot.js';

test('EDR-003 pilot: Project DNA travels the full runtime to closed', () => {
  const report = runPilot();

  // End-to-end traversal, gate-driven only:
  assert.equal(report.finalState, 'closed');
  assert.equal(report.stagesTraversed, 15); // intake → closed, no skips (SM-03)

  // Self-correction, not manual intervention (SM-02):
  assert.equal(report.loopbacks, 1); // verification coverage loopback
  assert.equal(report.telemetry.manual_interventions, 0);

  // Every artifact provenanced to DNA and its context bundle (AM-04, CE-06):
  assert.equal(report.artifacts.provenanceComplete, true);
  assert.ok(report.artifacts.approved >= 15);

  // Policies satisfied — deployment never blocked, no open issues:
  assert.equal(report.policies.deployBlocked, null);
  assert.equal(report.policies.openIssues, 0);

  // Deliverables of a deployable application exist:
  for (const type of ['contract.api', 'code.module', 'suite.test', 'config.pipeline', 'docs.delivered', 'report.security', 'report.learning', 'knowledge.entry']) {
    assert.ok(report.artifacts.byType[type] >= 1, `missing deliverable ${type}`);
  }

  // Platform observability recorded the run (OB-09):
  assert.ok(report.health.event_queue_depth > 100);
  assert.ok(report.health.gate_success_rate > 0.9);
});
