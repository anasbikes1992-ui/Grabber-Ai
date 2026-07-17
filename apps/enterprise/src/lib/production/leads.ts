import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/production/supabase";
import { getProductionEnv } from "@/lib/production/env";

export type LeadInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  preferred_time?: string;
  message?: string;
  source?: string;
  industry?: string;
  score?: number;
};

export type LeadRecord = {
  id: string;
  type: "lead";
  name: string;
  company: string;
  email: string;
  phone: string;
  preferred_time: string;
  message: string;
  source: string;
  industry: string;
  status: string;
  score: number;
  created_at: string;
  updated_at: string;
};

export function isSupabasePersistenceEnabled() {
  return getProductionEnv().supabaseConfigured;
}

export async function createLead(input: LeadInput): Promise<LeadRecord> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const row: LeadRecord = {
    id: randomUUID(),
    type: "lead",
    name: input.name,
    company: input.company || input.name,
    email: input.email || "",
    phone: input.phone || "",
    preferred_time: input.preferred_time || "",
    message: input.message || "",
    source: input.source || "website",
    industry: input.industry || "saas",
    status: "new",
    score: input.score || 50,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert([row] as never)
    .select("*")
    .single();
  if (error) {
    throw new Error(`supabase createLead failed: ${error.message}`);
  }

  return data as LeadRecord;
}

export async function listLeads(): Promise<LeadRecord[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    throw new Error(`supabase listLeads failed: ${error.message}`);
  }
  return (data || []) as LeadRecord[];
}
