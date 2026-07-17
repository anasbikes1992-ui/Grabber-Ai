import { list, save, get } from './store.js';
import { listEngagements } from './engagements.js';

/**
 * Operations dashboard aggregates (Program D).
 */
export function getOpsSnapshot(cwd) {
  const engagements = listEngagements(cwd);
  const tickets = list('tickets', cwd);
  const leads = engagements.filter((e) => e.status === 'lead');
  const pipeline = groupBy(engagements, (e) => e.status);
  const approved = engagements.filter((e) =>
    ['approved', 'in_factory', 'delivered', 'maintenance'].includes(e.status),
  );
  const revenue = engagements.reduce((s, e) => {
    const total = e.commercial?.pricing?.total || 0;
    if (e.approvals?.deposit) return s + total;
    return s;
  }, 0);
  const costs = Math.round(revenue * 0.35);
  const activeProjects = engagements.filter((e) =>
    ['in_factory', 'delivered', 'maintenance'].includes(e.status),
  );

  return {
    at: new Date().toISOString(),
    leads: leads.length,
    pipeline,
    active_projects: activeProjects.length,
    team_capacity: {
      available_hours_week: 120,
      allocated_hours_week: activeProjects.length * 25,
      utilization:
        activeProjects.length === 0
          ? 0
          : Math.min(1, (activeProjects.length * 25) / 120),
    },
    finance: {
      revenue_booked: revenue,
      estimated_cost: costs,
      gross_margin: revenue - costs,
      gross_margin_pct: revenue ? (revenue - costs) / revenue : 0,
    },
    maintenance_contracts: engagements.filter((e) => e.status === 'maintenance')
      .length,
    open_tickets: tickets.filter((t) => t.status !== 'closed').length,
    renewals_due: engagements.filter(
      (e) => e.status === 'maintenance' && e.renewal_due,
    ).length,
  };
}

export function createTicket(input, cwd) {
  const ticket = {
    id: undefined,
    type: 'ticket',
    engagement_id: input.engagement_id || null,
    client_name: input.client_name || '',
    subject: input.subject || 'Support request',
    priority: input.priority || 'normal',
    status: 'open',
    body: input.body || '',
  };
  return save('tickets', ticket, cwd);
}

export function listTickets(cwd) {
  return list('tickets', cwd);
}

export function updateTicket(id, patch, cwd) {
  const t = get('tickets', id, cwd);
  if (!t) throw new Error(`ticket ${id} not found`);
  Object.assign(t, patch, { updated_at: new Date().toISOString() });
  return save('tickets', t, cwd);
}

export function recordLead(input, cwd) {
  return save(
    'leads',
    {
      id: undefined,
      type: 'lead',
      name: input.name,
      company: input.company || input.name || '',
      email: input.email || '',
      phone: input.phone || '',
      preferred_time: input.preferred_time || '',
      message: input.message || '',
      source: input.source || 'website',
      industry: input.industry || 'saas',
      status: 'new',
      score: input.score || 50,
    },
    cwd,
  );
}

export function listLeads(cwd) {
  return list('leads', cwd);
}

function groupBy(arr, fn) {
  const o = {};
  for (const item of arr) {
    const k = fn(item);
    o[k] = (o[k] || 0) + 1;
  }
  return o;
}
