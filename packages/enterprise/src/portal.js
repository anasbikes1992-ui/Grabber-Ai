import {
  getEngagement,
  listEngagements,
  advanceGovernance,
} from './engagements.js';
import { listTickets, createTicket } from './ops.js';
import { listDeliveries } from './delivery.js';
import { save, list } from './store.js';

/**
 * Client Experience — transparent project portal.
 * Clients never see factory internals; they see status, docs, money, support.
 */
export function listPortalClients(cwd) {
  const names = new Set();
  for (const e of listEngagements(cwd)) {
    if (e.client_name) names.add(e.client_name);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function getClientPortalView(clientName, cwd) {
  const name = String(clientName || '').toLowerCase();
  const engagements = listEngagements(cwd).filter(
    (e) => e.client_name.toLowerCase() === name,
  );
  if (!engagements.length) {
    return {
      ok: false,
      error: 'no engagements for client',
      client: clientName,
      clients: listPortalClients(cwd),
    };
  }

  const primary = engagements[0];
  const commercial = primary.commercial || {};
  const pricing = commercial.pricing || {};
  const deliverables = commercial.deliverables
    ? Object.entries(commercial.deliverables).map(([k, v]) => ({
        key: k,
        title: v.title || humanize(k),
        id: v.id,
        category: categorizeDeliverable(k),
        preview: summarizeDeliverable(k, v),
      }))
    : [];

  const proposals = commercial.pricing
    ? [
        {
          id: commercial.ids?.proposal || `prop-${primary.id}`,
          headline:
            commercial.deliverables?.proposal?.headline ||
            `Proposal for ${primary.client_name}`,
          total: pricing.total,
          deposit: pricing.deposit,
          remainder: pricing.remainder,
          currency: pricing.currency || 'USD',
          payment_terms: pricing.payment_terms,
          validity_days: commercial.deliverables?.proposal?.validity_days || 30,
          status: primary.approvals?.client ? 'accepted' : 'pending_approval',
          weeks: commercial.timeline?.weeks || primary.solution?.timeline_weeks,
          blueprint: primary.solution?.blueprint,
        },
      ]
    : [];

  const contracts = [];
  if (commercial.deliverables?.statement_of_work) {
    contracts.push({
      id: commercial.deliverables.statement_of_work.id,
      type: 'SOW',
      title: 'Statement of Work',
      status: primary.approvals?.client ? 'accepted' : 'draft',
    });
  }
  if (commercial.deliverables?.msa_draft) {
    contracts.push({
      id: commercial.deliverables.msa_draft.id,
      type: 'MSA',
      title: 'Master Service Agreement (draft)',
      status: 'review',
    });
  }

  const invoices = [];
  if (pricing.deposit) {
    invoices.push({
      id: `dep-${primary.id}`,
      type: 'deposit',
      label: 'Project deposit',
      amount: pricing.deposit,
      currency: pricing.currency || 'USD',
      status: primary.approvals?.deposit ? 'paid' : 'due',
      at: primary.approvals?.deposit?.at || null,
      terms: pricing.payment_terms,
    });
  }
  if (pricing.remainder && primary.approvals?.deposit) {
    invoices.push({
      id: `bal-${primary.id}`,
      type: 'balance_schedule',
      label: 'Remaining per SOW',
      amount: pricing.remainder,
      currency: pricing.currency || 'USD',
      status: 'scheduled',
      at: null,
      terms: pricing.payment_terms,
    });
  }

  const builds = listDeliveries(cwd).filter(
    (d) => d.client_name.toLowerCase() === name,
  );

  const tickets = listTickets(cwd).filter(
    (t) =>
      t.client_name?.toLowerCase() === name ||
      engagements.some((e) => e.id === t.engagement_id),
  );

  const milestones = (commercial.timeline?.milestones || []).map((m, i) => ({
    ...m,
    index: i + 1,
    state: milestoneState(m, primary),
  }));

  const project_status = deriveProjectStatus(primary, builds);
  const timeline = buildActivityTimeline(primary, builds, tickets);
  const meetings = primary.meetings || defaultMeetings(primary);
  const approvals = {
    internal: Boolean(primary.approvals?.internal),
    client: Boolean(primary.approvals?.client),
    deposit: Boolean(primary.approvals?.deposit),
    factory_ready: Boolean(primary.factory_eligible),
  };

  return {
    ok: true,
    client: primary.client_name,
    contact_email: primary.contact_email || '',
    industry: primary.industry,
    primary_engagement_id: primary.id,
    project_status,
    progress_pct: project_status.progress_pct,
    trust_message:
      'You are working with a Grabber consulting team. Delivery status, documents, and money are always visible here.',
    engagements: engagements.map((e) => ({
      id: e.id,
      status: e.status,
      stage: e.governance_stage,
      industry: e.industry,
      factory_eligible: e.factory_eligible,
      confidence: e.consulting?.confidence ?? null,
      commercial_total: e.commercial?.pricing?.total ?? null,
    })),
    proposals,
    contracts,
    documents: deliverables,
    documents_by_category: groupBy(deliverables, (d) => d.category),
    invoices,
    builds: builds.map((b) => ({
      id: b.id,
      status: b.status,
      url: b.production_url,
      environment: b.environment,
      monitoring: b.monitoring,
      maintenance: b.maintenance,
      timeline: b.timeline?.slice(-5) || [],
    })),
    milestones,
    timeline,
    meetings,
    approvals,
    can_approve: Boolean(primary.commercial && !primary.approvals?.client),
    can_confirm_deposit: Boolean(
      primary.approvals?.client && !primary.approvals?.deposit,
    ),
    executive_briefing_url: primary.consulting?.executive_html
      ? `/api/consulting?id=${primary.id}&format=html`
      : null,
    comments: primary.comments || [],
    uploads: primary.uploads || [],
    tickets,
    clients: listPortalClients(cwd),
  };
}

function deriveProjectStatus(e, builds) {
  if (builds.some((b) => b.status === 'maintenance')) {
    return {
      label: 'In support / maintenance',
      code: 'support',
      progress_pct: 100,
    };
  }
  if (builds.some((b) => b.status === 'deployed')) {
    return { label: 'Deployed', code: 'deployed', progress_pct: 95 };
  }
  if (e.factory_eligible || e.status === 'in_factory') {
    return {
      label: 'In delivery',
      code: 'delivery',
      progress_pct: 70,
    };
  }
  if (e.approvals?.deposit) {
    return {
      label: 'Deposit received — delivery starting',
      code: 'funded',
      progress_pct: 55,
    };
  }
  if (e.approvals?.client) {
    return {
      label: 'Proposal accepted — deposit pending',
      code: 'accepted',
      progress_pct: 45,
    };
  }
  if (e.commercial) {
    return {
      label: 'Proposal ready for your review',
      code: 'proposal',
      progress_pct: 35,
    };
  }
  if (e.consulting?.gap_analysis || e.analysis) {
    return {
      label: 'Analysis in progress',
      code: 'analysis',
      progress_pct: 25,
    };
  }
  return {
    label: 'Discovery',
    code: 'discovery',
    progress_pct: 15,
  };
}

function milestoneState(m, e) {
  const week = m.week || 0;
  if (e.factory_eligible && week <= 2) return 'done';
  if (e.approvals?.deposit && week <= 2) return 'done';
  if (e.approvals?.client && week <= 1) return 'done';
  if (e.commercial && week <= 1) return 'current';
  return 'upcoming';
}

function buildActivityTimeline(e, builds, tickets) {
  const events = [];
  events.push({
    at: e.created_at,
    kind: 'engagement',
    text: 'Engagement opened',
  });
  if (e.consulting?.business_story) {
    events.push({
      at: e.created_at,
      kind: 'discovery',
      text: 'Business story captured',
    });
  }
  for (const h of e.governance_history || []) {
    events.push({
      at: h.at,
      kind: 'governance',
      text: `${humanize(h.stage)} — ${h.note || h.actor || ''}`.trim(),
    });
  }
  if (e.commercial) {
    events.push({
      at: e.commercial.at || e.updated_at,
      kind: 'commercial',
      text: `Proposal package ready (${e.commercial.pricing?.currency || 'USD'} ${e.commercial.pricing?.total})`,
    });
  }
  for (const b of builds) {
    events.push({
      at: b.updated_at || b.created_at,
      kind: 'delivery',
      text: `Delivery ${b.status}${b.production_url ? ` — ${b.production_url}` : ''}`,
    });
  }
  for (const t of tickets.slice(0, 5)) {
    events.push({
      at: t.created_at || t.updated_at,
      kind: 'support',
      text: `Support: ${t.subject} (${t.status})`,
    });
  }
  return events
    .filter((x) => x.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 20);
}

function defaultMeetings(e) {
  const meetings = [];
  if (e.consulting || e.notes) {
    meetings.push({
      id: 'm-discovery',
      title: 'Discovery working session',
      status: e.commercial ? 'completed' : 'scheduled',
      when: 'As coordinated with your consultant',
    });
  }
  if (e.commercial) {
    meetings.push({
      id: 'm-proposal',
      title: 'Proposal walkthrough',
      status: e.approvals?.client ? 'completed' : 'available',
      when: 'Book via your consultant',
    });
  }
  if (e.approvals?.deposit || e.factory_eligible) {
    meetings.push({
      id: 'm-kickoff',
      title: 'Delivery kickoff',
      status: e.factory_eligible ? 'scheduled' : 'pending_deposit',
      when: 'After deposit',
    });
  }
  return meetings;
}

function categorizeDeliverable(key) {
  if (/proposal|cost|timeline|sow|statement|msa|change_request/i.test(key)) {
    return 'commercial';
  }
  if (/architecture|module|integration|deployment|solution/i.test(key)) {
    return 'technical';
  }
  if (/requirement|scope|functional|acceptance|uat/i.test(key)) {
    return 'scope';
  }
  return 'business';
}

function summarizeDeliverable(key, v) {
  if (v.body) return String(v.body).slice(0, 120);
  if (v.headline) return v.headline;
  if (v.modules) return `Modules: ${(v.modules || []).slice(0, 4).join(', ')}`;
  if (v.total != null) return `Total ${v.total}`;
  return humanize(key);
}

function humanize(s) {
  return String(s)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupBy(arr, fn) {
  const o = {};
  for (const item of arr) {
    const k = fn(item);
    if (!o[k]) o[k] = [];
    o[k].push(item);
  }
  return o;
}

export function clientApprove(engagementId, actor, cwd) {
  return advanceGovernance(
    engagementId,
    { stage: 'client_approval', actor, notes: 'client portal approval' },
    cwd,
  );
}

export function clientConfirmDeposit(engagementId, actor, cwd) {
  return advanceGovernance(
    engagementId,
    {
      stage: 'deposit_received',
      actor: actor || 'client-finance',
      notes: 'deposit confirmed via portal',
    },
    cwd,
  );
}

export function clientCreateTicket(clientName, subject, body, cwd) {
  const engagements = listEngagements(cwd).filter(
    (e) => e.client_name.toLowerCase() === clientName.toLowerCase(),
  );
  return createTicket(
    {
      client_name: clientName,
      engagement_id: engagements[0]?.id,
      subject,
      body,
    },
    cwd,
  );
}

export function clientComment(engagementId, author, text, cwd) {
  const e = getEngagement(engagementId, cwd);
  e.comments = e.comments || [];
  e.comments.push({
    author,
    text,
    at: new Date().toISOString(),
  });
  return save('engagements', e, cwd);
}

export function clientUploadMeta(engagementId, fileName, cwd) {
  const e = getEngagement(engagementId, cwd);
  e.uploads = e.uploads || [];
  e.uploads.push({ name: fileName, at: new Date().toISOString() });
  return save('engagements', e, cwd);
}

export function clientScheduleMeeting(engagementId, input, cwd) {
  const e = getEngagement(engagementId, cwd);
  e.meetings = e.meetings || [];
  e.meetings.push({
    id: `meet-${Date.now().toString(36)}`,
    title: input.title || 'Client meeting',
    when: input.when || 'TBD',
    status: 'requested',
    notes: input.notes || '',
    at: new Date().toISOString(),
  });
  return save('engagements', e, cwd);
}
