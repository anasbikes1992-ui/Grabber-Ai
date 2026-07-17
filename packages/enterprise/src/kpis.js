import { listEngagements } from './engagements.js';
import { listLeads, getOpsSnapshot } from './ops.js';
import { listCampaigns } from './marketing.js';
import { listDeliveries } from './delivery.js';

/**
 * Whole-business KPIs (Enterprise success metrics).
 */
export function getBusinessKpis(cwd) {
  const engagements = listEngagements(cwd);
  const leads = listLeads(cwd);
  const ops = getOpsSnapshot(cwd);
  const campaigns = listCampaigns(cwd);
  const deliveries = listDeliveries(cwd);

  const proposals = engagements.filter((e) => e.commercial).length;
  const accepted = engagements.filter((e) => e.approvals?.client).length;
  const discoveryDone = engagements.filter((e) => e.discovery?.completed).length;

  return {
    at: new Date().toISOString(),
    sales: {
      leads: leads.length + engagements.filter((e) => e.status === 'lead').length,
      proposals,
      lead_to_proposal_conversion:
        engagements.length === 0 ? 0 : proposals / engagements.length,
      proposal_acceptance_rate: proposals === 0 ? 0 : accepted / proposals,
    },
    discovery: {
      completed: discoveryDone,
      completion_rate:
        engagements.length === 0 ? 0 : discoveryDone / engagements.length,
    },
    factory: {
      eligible: engagements.filter((e) => e.factory_eligible).length,
      in_factory: engagements.filter((e) => e.status === 'in_factory').length,
    },
    finance: ops.finance,
    quality: {
      first_pass_proxy: 1, // factory metrics live elsewhere
    },
    customer_success: {
      maintenance: ops.maintenance_contracts,
      open_tickets: ops.open_tickets,
      renewals_due: ops.renewals_due,
      deployments: deliveries.filter((d) => d.status === 'deployed').length,
    },
    marketing: {
      campaigns: campaigns.length,
      published: campaigns.reduce(
        (s, c) => s + (c.publications?.length || 0),
        0,
      ),
    },
    experience: {
      client_satisfaction_proxy: accepted > 0 ? 0.9 : null,
    },
  };
}
