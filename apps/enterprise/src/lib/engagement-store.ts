import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getSupabaseAdminClient } from "@/lib/production/supabase";
import { getProductionEnv } from "@/lib/production/env";
import { log } from "@/lib/production/logger";

/**
 * Durable mirror for the engine's engagement records.
 *
 * The engine keeps its deterministic file store (tmp dir on Vercel — wiped
 * per invocation). This module makes engagements survive:
 *  - hydrate: on cold start, pull all rows from Supabase into the tmp store
 *    so the engine sees them (read-through)
 *  - mirror: after mutations, upsert every engagement file back to Supabase
 * Small-N by design (a consultancy's engagement count), so full sync is fine.
 * Everything is best-effort: without Supabase the file store still works.
 */

type EngagementRow = {
  id: string;
  data: Record<string, unknown>;
  client_name: string | null;
  status: string | null;
  governance_stage: string | null;
  updated_at: string;
};

type EngagementsClient = {
  from: (table: "engagements") => {
    select: (columns: string) => Promise<{ data: unknown; error: { message: string } | null }>;
    upsert: (
      values: Record<string, unknown>[],
      options?: { onConflict?: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
};

function collectionDir(name: string): string {
  const root = process.env.GRABBER_ENTERPRISE_DIR;
  if (!root) throw new Error("GRABBER_ENTERPRISE_DIR not set (call ensureEnterpriseDataDir first)");
  return join(root, name);
}

function engagementsDir(): string {
  return collectionDir("engagements");
}

type LeadsClient = {
  from: (table: "leads") => {
    select: (columns: string) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
};

export function isDurableStoreConfigured(): boolean {
  return getProductionEnv().supabaseConfigured;
}

let hydrated: Promise<void> | null = null;

/** Pull all engagements from Supabase into the tmp file store (once per invocation). */
export function hydrateEngagements(): Promise<void> {
  if (!isDurableStoreConfigured()) return Promise.resolve();
  if (hydrated) return hydrated;
  hydrated = (async () => {
    try {
      const supabase = getSupabaseAdminClient() as unknown as EngagementsClient;
      const { data, error } = await supabase.from("engagements").select("id,data");
      if (error) throw new Error(error.message);
      const dir = engagementsDir();
      mkdirSync(dir, { recursive: true });
      for (const row of (data as Pick<EngagementRow, "id" | "data">[]) ?? []) {
        const path = join(dir, `${row.id}.json`);
        if (!existsSync(path)) {
          writeFileSync(path, JSON.stringify(row.data, null, 2));
        }
      }
    } catch (e) {
      log("warn", {
        event: "engagements.hydrate_failed",
        details: { message: e instanceof Error ? e.message : String(e) },
      });
    }
  })();
  return hydrated;
}

let leadsHydrated: Promise<void> | null = null;

/**
 * Pull all leads from the existing Supabase `leads` table (already the
 * primary write target of POST /api/leads) into the engine's file store,
 * so getBusinessKpis() / listLeads() — which only read the file store —
 * see leads that were created straight into Supabase.
 */
export function hydrateLeads(): Promise<void> {
  if (!isDurableStoreConfigured()) return Promise.resolve();
  if (leadsHydrated) return leadsHydrated;
  leadsHydrated = (async () => {
    try {
      const supabase = getSupabaseAdminClient() as unknown as LeadsClient;
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw new Error(error.message);
      const dir = collectionDir("leads");
      mkdirSync(dir, { recursive: true });
      for (const row of (data as { id: string }[]) ?? []) {
        const path = join(dir, `${row.id}.json`);
        if (!existsSync(path)) {
          writeFileSync(path, JSON.stringify(row, null, 2));
        }
      }
    } catch (e) {
      log("warn", {
        event: "leads.hydrate_failed",
        details: { message: e instanceof Error ? e.message : String(e) },
      });
    }
  })();
  return leadsHydrated;
}

/** Upsert every engagement file in the tmp store back to Supabase. */
export async function mirrorEngagements(): Promise<void> {
  if (!isDurableStoreConfigured()) return;
  try {
    const dir = engagementsDir();
    if (!existsSync(dir)) return;
    const rows: Record<string, unknown>[] = [];
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const data = JSON.parse(readFileSync(join(dir, file), "utf8")) as Record<string, unknown>;
        const id = String(data.id ?? file.replace(/\.json$/, ""));
        rows.push({
          id,
          data,
          client_name: (data.client_name as string) ?? null,
          status: (data.status as string) ?? null,
          governance_stage: (data.governance_stage as string) ?? null,
          updated_at: new Date().toISOString(),
        });
      } catch {
        // skip unreadable file
      }
    }
    if (rows.length === 0) return;
    const supabase = getSupabaseAdminClient() as unknown as EngagementsClient;
    const { error } = await supabase.from("engagements").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  } catch (e) {
    log("warn", {
      event: "engagements.mirror_failed",
      details: { message: e instanceof Error ? e.message : String(e) },
    });
  }
}

/**
 * Upsert leads written by the engine's file-store fallback (i.e. when the
 * direct Supabase insert in lib/production/leads.ts failed) back into the
 * `leads` table, so they aren't lost on the next cold start.
 */
export async function mirrorLeads(): Promise<void> {
  if (!isDurableStoreConfigured()) return;
  try {
    const dir = collectionDir("leads");
    if (!existsSync(dir)) return;
    const rows: Record<string, unknown>[] = [];
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        rows.push(JSON.parse(readFileSync(join(dir, file), "utf8")) as Record<string, unknown>);
      } catch {
        // skip unreadable file
      }
    }
    if (rows.length === 0) return;
    const supabase = getSupabaseAdminClient() as unknown as {
      from: (t: "leads") => {
        upsert: (
          v: Record<string, unknown>[],
          o?: { onConflict?: string },
        ) => Promise<{ error: { message: string } | null }>;
      };
    };
    const { error } = await supabase.from("leads").upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  } catch (e) {
    log("warn", {
      event: "leads.mirror_failed",
      details: { message: e instanceof Error ? e.message : String(e) },
    });
  }
}
