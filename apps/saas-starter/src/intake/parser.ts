import type { IntakeInput } from "./types";

export function parseIntakeInput(raw: unknown): {
  ok: boolean;
  value?: IntakeInput;
  errors: string[];
} {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["intake body must be an object"] };
  }
  const r = raw as Record<string, unknown>;
  const text = String(r.text ?? r.message ?? r.conversation ?? "").trim();
  if (text.length < 12) {
    errors.push("conversation/text must be at least 12 characters");
  }
  if (errors.length) return { ok: false, errors };

  const clarifications =
    r.clarifications && typeof r.clarifications === "object"
      ? (r.clarifications as Record<string, string>)
      : undefined;

  const uploads = Array.isArray(r.uploads)
    ? r.uploads.map((u) => {
        if (typeof u === "string") return { name: u };
        const o = u as { name?: string; kind?: string };
        return { name: String(o.name ?? "file"), kind: o.kind };
      })
    : undefined;

  return {
    ok: true,
    value: {
      text,
      name_hint: r.name_hint ? String(r.name_hint) : undefined,
      industry: r.industry ? String(r.industry) : undefined,
      business_model: r.business_model ? String(r.business_model) : undefined,
      locale: r.locale ? String(r.locale) : "en",
      clarifications,
      uploads,
    },
    errors: [],
  };
}

/** Merge clarification answers into conversation blob for re-extraction. */
export function expandConversation(input: IntakeInput): string {
  const parts = [input.text];
  if (input.clarifications) {
    for (const [q, a] of Object.entries(input.clarifications)) {
      if (a?.trim()) parts.push(`Q: ${q}\nA: ${a.trim()}`);
    }
  }
  if (input.uploads?.length) {
    parts.push(
      `Attachments: ${input.uploads.map((u) => u.name).join(", ")}`,
    );
  }
  return parts.join("\n\n");
}
