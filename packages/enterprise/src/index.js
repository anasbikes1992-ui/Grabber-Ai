export * from './types.js';
export * from './playbooks.js';
export * from './engagements.js';
export * from './commercial.js';
export * from './ops.js';
export * from './delivery.js';
export * from './marketing.js';
export * from './portal.js';
export * from './kpis.js';
export * from './consulting.js';
export * from './knowledge-graph.js';
export * from './decision-intelligence.js';
export * from './llm.js';
export * from './verifier.js';
export * from './executive-package.js';
export { dataRoot } from './store.js';

import {
  createEngagement,
  runBusinessAnalysis,
  designSolution,
  runCommercialAutomation,
  advanceGovernance,
  getFactoryHandoff,
} from './engagements.js';

/** Full Milestone 1 happy path for tests / demos. */
export function milestone1Sync(clientName, industry, cwd) {
  let e = createEngagement(
    { name: clientName, industry, contact_email: 'client@example.com' },
    cwd,
  );
  e = runBusinessAnalysis(
    e.id,
    {
      'primary-process': 'Online booking and payments for guests',
      users: 'guest, provider, admin',
      success: 'More bookings, less phone ops',
      payments: 'Stripe deposit required',
    },
    cwd,
  );
  e = designSolution(e.id, {}, cwd);
  e = runCommercialAutomation(e.id, cwd);
  e = advanceGovernance(
    e.id,
    { stage: 'risk_review', actor: 'delivery-lead', notes: 'risks accepted' },
    cwd,
  );
  e = advanceGovernance(
    e.id,
    { stage: 'legal_review', actor: 'legal', notes: 'MSA path ok' },
    cwd,
  );
  e = advanceGovernance(
    e.id,
    { stage: 'internal_approval', actor: 'cto', notes: 'approved' },
    cwd,
  );
  e = advanceGovernance(
    e.id,
    { stage: 'client_approval', actor: 'client', notes: 'signed' },
    cwd,
  );
  e = advanceGovernance(
    e.id,
    { stage: 'deposit_received', actor: 'finance', notes: '40%' },
    cwd,
  );
  e = advanceGovernance(
    e.id,
    { stage: 'factory_ready', actor: 'ops', notes: 'handoff' },
    cwd,
  );
  const handoff = getFactoryHandoff(e.id, cwd);
  return { engagement: e, handoff };
}
