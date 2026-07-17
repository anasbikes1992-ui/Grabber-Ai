import { save, get, list } from './store.js';

/**
 * Marketing Intelligence (Program E) — separate from Product Factory.
 * Pipeline: trends → competitors → keywords → plan → create → approve → publish → analytics
 */
export const MARKETING_STAGES = Object.freeze([
  'trend_discovery',
  'competitor_monitoring',
  'keyword_research',
  'content_planning',
  'content_creation',
  'human_approval',
  'publishing',
  'analytics',
]);

export function createCampaign(input, cwd) {
  const campaign = {
    id: undefined,
    type: 'campaign',
    name: input.name || 'Untitled campaign',
    stage: 'trend_discovery',
    industry: input.industry || 'general',
    platforms: input.platforms || [
      'instagram',
      'linkedin',
      'x',
      'tiktok',
      'youtube',
    ],
    trends: [],
    competitors: [],
    keywords: [],
    content_plan: [],
    content_items: [],
    approvals: [],
    publications: [],
    analytics: null,
  };
  return save('campaigns', campaign, cwd);
}

export function listCampaigns(cwd) {
  return list('campaigns', cwd);
}

export function getCampaign(id, cwd) {
  const c = get('campaigns', id, cwd);
  if (!c) throw new Error(`campaign ${id} not found`);
  return c;
}

export function runTrendDiscovery(campaignId, cwd) {
  const c = getCampaign(campaignId, cwd);
  c.trends = [
    { topic: `${c.industry} digital transformation`, score: 82 },
    { topic: 'AI software delivery', score: 91 },
    { topic: 'no-code vs factory model', score: 74 },
  ];
  c.stage = 'competitor_monitoring';
  return save('campaigns', c, cwd);
}

export function runCompetitorScan(campaignId, cwd) {
  const c = getCampaign(campaignId, cwd);
  c.competitors = [
    { name: 'Traditional agency', weakness: 'slow, expensive custom builds' },
    { name: 'Generic SaaS', weakness: 'poor industry fit' },
    { name: 'AI code copilots', weakness: 'no delivery governance' },
  ];
  c.stage = 'keyword_research';
  return save('campaigns', c, cwd);
}

export function runKeywordResearch(campaignId, cwd) {
  const c = getCampaign(campaignId, cwd);
  c.keywords = [
    { term: 'AI software factory', volume: 'med', intent: 'commercial' },
    { term: `${c.industry} booking software`, volume: 'high', intent: 'buy' },
    { term: 'custom software fixed price', volume: 'med', intent: 'buy' },
  ];
  c.stage = 'content_planning';
  return save('campaigns', c, cwd);
}

export function planContent(campaignId, cwd) {
  const c = getCampaign(campaignId, cwd);
  c.content_plan = [
    { type: 'thread', platform: 'x', title: 'Why factories beat freelancers' },
    {
      type: 'carousel',
      platform: 'linkedin',
      title: 'DNA → production in one pipeline',
    },
    {
      type: 'short',
      platform: 'tiktok',
      title: 'Client idea to live app',
    },
  ];
  c.stage = 'content_creation';
  return save('campaigns', c, cwd);
}

export function createContent(campaignId, cwd) {
  const c = getCampaign(campaignId, cwd);
  c.content_items = (c.content_plan || []).map((p, i) => ({
    id: `c${i + 1}`,
    ...p,
    body: `Draft: ${p.title}. Grabber turns Project DNA into production apps with governance and module reuse.`,
    status: 'draft',
  }));
  c.stage = 'human_approval';
  return save('campaigns', c, cwd);
}

export function approveContent(campaignId, itemId, actor, cwd) {
  const c = getCampaign(campaignId, cwd);
  const item = c.content_items.find((i) => i.id === itemId);
  if (!item) throw new Error(`content ${itemId} not found`);
  item.status = 'approved';
  c.approvals.push({
    item_id: itemId,
    actor,
    at: new Date().toISOString(),
  });
  if (c.content_items.every((i) => i.status === 'approved')) {
    c.stage = 'publishing';
  }
  return save('campaigns', c, cwd);
}

export function publishApproved(campaignId, cwd) {
  const c = getCampaign(campaignId, cwd);
  const approved = c.content_items.filter((i) => i.status === 'approved');
  if (!approved.length) throw new Error('no approved content');
  for (const item of approved) {
    item.status = 'published';
    c.publications.push({
      item_id: item.id,
      platform: item.platform,
      at: new Date().toISOString(),
      url: `https://example.com/${item.platform}/${item.id}`,
    });
  }
  c.stage = 'analytics';
  c.analytics = {
    reach: approved.length * 1200,
    engagement_rate: 0.045,
    leads_attributed: Math.max(1, Math.floor(approved.length * 0.5)),
  };
  return save('campaigns', c, cwd);
}
