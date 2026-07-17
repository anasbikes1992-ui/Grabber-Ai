import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/production/supabase";
import { getProductionEnv } from "@/lib/production/env";
import { log } from "@/lib/production/logger";

type DomainEventInput = {
  type: string;
  subject: string;
  payload?: Record<string, unknown>;
  projectId?: string;
  stage?: string;
  actor?: string;
};

export async function publishDomainEvent(input: DomainEventInput) {
  const env = getProductionEnv();
  if (!env.supabaseConfigured) {
    log("info", {
      event: "event.bus.skipped",
      details: { type: input.type, reason: "supabase_not_configured" },
    });
    return;
  }

  const supabase = getSupabaseAdminClient();
  const row = {
    id: `evt_${randomUUID()}`,
    type: input.type,
    project_id: input.projectId || "platform",
    stage: input.stage || "intake",
    subject: input.subject,
    actor: input.actor || "enterprise-api",
    payload: input.payload || {},
    occurred_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("events").insert([row] as never);
  if (error) {
    log("warn", {
      event: "event.bus.insert_failed",
      details: { type: input.type, message: error.message },
    });
  }
}
