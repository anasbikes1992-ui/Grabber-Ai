import { save, get, list } from './store.js';
import { getEngagement } from './engagements.js';

/**
 * Delivery & Support (Milestone 5): deployments, monitoring, maintenance, renewals.
 */
export function createDeliveryRecord(engagementId, input = {}, cwd) {
  const e = getEngagement(engagementId, cwd);
  const rec = {
    id: undefined,
    type: 'delivery',
    engagement_id: engagementId,
    client_name: e.client_name,
    status: 'tracking',
    environment: input.environment || 'production',
    production_url: input.production_url || null,
    monitoring: {
      uptime_target: '99.9%',
      last_check: new Date().toISOString(),
      healthy: true,
    },
    support: {
      sla: 'business_hours',
      channel: 'portal',
    },
    maintenance: {
      plan: 'standard',
      renewal_date: input.renewal_date || monthsFromNow(12),
      active: false,
    },
    timeline: [
      {
        at: new Date().toISOString(),
        event: 'delivery_record_created',
      },
    ],
  };
  return save('deliveries', rec, cwd);
}

export function markDeployed(deliveryId, url, cwd) {
  const d = get('deliveries', deliveryId, cwd);
  if (!d) throw new Error(`delivery ${deliveryId} not found`);
  d.production_url = url;
  d.status = 'deployed';
  d.timeline.push({ at: new Date().toISOString(), event: 'deployed', url });
  d.monitoring.last_check = new Date().toISOString();
  return save('deliveries', d, cwd);
}

export function activateMaintenance(deliveryId, cwd) {
  const d = get('deliveries', deliveryId, cwd);
  if (!d) throw new Error(`delivery ${deliveryId} not found`);
  d.maintenance.active = true;
  d.status = 'maintenance';
  d.timeline.push({
    at: new Date().toISOString(),
    event: 'maintenance_activated',
  });
  // sync engagement if present
  try {
    const e = getEngagement(d.engagement_id, cwd);
    e.status = 'maintenance';
    e.renewal_due = d.maintenance.renewal_date;
    save('engagements', e, cwd);
  } catch {
    /* optional */
  }
  return save('deliveries', d, cwd);
}

export function listDeliveries(cwd) {
  return list('deliveries', cwd);
}

export function getDelivery(id, cwd) {
  return get('deliveries', id, cwd);
}

export function healthCheck(deliveryId, cwd) {
  const d = get('deliveries', deliveryId, cwd);
  if (!d) throw new Error(`delivery ${deliveryId} not found`);
  d.monitoring.last_check = new Date().toISOString();
  d.monitoring.healthy = Boolean(d.production_url);
  d.timeline.push({
    at: d.monitoring.last_check,
    event: 'health_check',
    healthy: d.monitoring.healthy,
  });
  return save('deliveries', d, cwd);
}

function monthsFromNow(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}
