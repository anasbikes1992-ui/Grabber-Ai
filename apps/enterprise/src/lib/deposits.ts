import { getSupabaseAdminClient } from "@/lib/production/supabase";
import { getProductionEnv } from "@/lib/production/env";

/**
 * Durable record of a paid deposit — the source of truth for "paid",
 * independent of the ephemeral engine file store (which does not persist
 * across serverless invocations). Requires a `deposits` table (see setup).
 */
export type Deposit = {
  engagement_id: string;
  client_name: string | null;
  amount: number;
  currency: string;
  status: string;
  stripe_session_id: string | null;
  paid_at: string;
};

export function isDepositStoreReady(): boolean {
  return getProductionEnv().supabaseConfigured;
}

// Minimal typed facade over the untyped service-role client (no Database
// generic is registered, so `.from()` would otherwise infer `never`).
type DepositsClient = {
  from: (table: "deposits") => {
    upsert: (
      value: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => Promise<{ error: { message: string } | null }>;
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: unknown }>;
      };
    };
  };
};

function depositsClient(): DepositsClient {
  return getSupabaseAdminClient() as unknown as DepositsClient;
}

export async function recordDeposit(input: {
  engagement_id: string;
  client_name?: string | null;
  amount: number;
  currency: string;
  stripe_session_id?: string | null;
}): Promise<void> {
  const row = {
    engagement_id: input.engagement_id,
    client_name: input.client_name ?? null,
    amount: input.amount,
    currency: input.currency,
    status: "paid",
    stripe_session_id: input.stripe_session_id ?? null,
    paid_at: new Date().toISOString(),
  };
  const { error } = await depositsClient()
    .from("deposits")
    .upsert(row, { onConflict: "engagement_id" });
  if (error) throw new Error(error.message);
}

export async function getDeposit(engagementId: string): Promise<Deposit | null> {
  const { data } = await depositsClient()
    .from("deposits")
    .select("*")
    .eq("engagement_id", engagementId)
    .maybeSingle();
  return (data as Deposit | null) ?? null;
}
