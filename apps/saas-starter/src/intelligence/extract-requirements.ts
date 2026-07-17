import type { ClientRequest, Requirements } from "./types";

/**
 * Deterministic requirements extraction (Sprint 2).
 * Offline-safe; mirrors discovery prompt contract without calling an LLM.
 */
export function extractRequirements(req: ClientRequest): Requirements {
  const text = req.text;
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const goals =
    sentences.length > 0
      ? sentences.slice(0, 5)
      : [text.slice(0, 120)];

  const users = inferUsers(text);
  const critical_flows = inferFlows(text);
  const acceptance = goals.map((g, i) => ({
    id: `AC-${i + 1}`,
    statement: g,
  }));

  const unknowns: string[] = [];
  if (!/\b(auth|login|sign\s*in)\b/i.test(text)) {
    unknowns.push("authentication model not specified");
  }
  if (!/\b(pay|billing|stripe|subscription)\b/i.test(text)) {
    unknowns.push("monetization model not specified");
  }

  const risks: string[] = [];
  if (/\b(hipaa|phi|health)\b/i.test(text)) {
    risks.push("regulated healthcare data may require elevated security");
  }
  if (/\b(marketplace|two-sided)\b/i.test(text)) {
    risks.push("two-sided marketplace complexity (payments + inventory)");
  }

  return {
    goals,
    users,
    critical_flows,
    acceptance,
    unknowns,
    risks,
  };
}

function inferUsers(text: string): Requirements["users"] {
  const users: Requirements["users"] = [];
  if (/\badmin\b/i.test(text)) {
    users.push({ role: "admin", goals: ["configure system", "manage users"] });
  }
  if (/\b(customer|client|buyer)\b/i.test(text)) {
    users.push({ role: "customer", goals: ["use product", "manage account"] });
  }
  if (/\b(seller|vendor|provider)\b/i.test(text)) {
    users.push({ role: "seller", goals: ["list offerings", "fulfill orders"] });
  }
  if (/\b(team|member|employee)\b/i.test(text)) {
    users.push({ role: "member", goals: ["collaborate", "complete work"] });
  }
  if (users.length === 0) {
    users.push(
      { role: "owner", goals: ["configure tenant", "invite team"] },
      { role: "member", goals: ["use core features"] },
    );
  }
  return users;
}

function inferFlows(text: string): string[] {
  const flows = new Set<string>(["sign up", "sign in", "open dashboard"]);
  if (/\binvite\b/i.test(text)) flows.add("invite member");
  if (/\b(pay|billing|subscription|plan)\b/i.test(text)) flows.add("upgrade plan");
  if (/\bbook|schedul|appointment|reserv/i.test(text)) {
    flows.add("book slot");
    flows.add("manage availability");
  }
  if (/\b(crm|deal|pipeline|contact)\b/i.test(text)) {
    flows.add("create contact");
    flows.add("move deal stage");
  }
  if (/\b(market|order|cart|checkout)\b/i.test(text)) {
    flows.add("search catalog");
    flows.add("checkout pay");
  }
  return [...flows];
}
