/**
 * Single place the enterprise package may call an LLM.
 * Consulting only — never application code generation.
 *
 * API available   → model call → caller runs Verifier
 * API unavailable → caller uses deterministic path
 *
 * Model id: GRABBER_LLM_MODEL or claude-sonnet-5 (Claude Platform docs).
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** @see https://platform.claude.com/docs/en/about-claude/models/overview */
export const DEFAULT_CONSULTING_MODEL =
  process.env.GRABBER_LLM_MODEL || 'claude-sonnet-5';

export function isLlmAvailable() {
  if (process.env.GRABBER_LLM === '0' || process.env.GRABBER_LLM === 'off') {
    return false;
  }
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * @param {{ system: string, user: string, schemaHint?: string, maxTokens?: number, model?: string }} opts
 * @returns {Promise<{ ok: true, data: object, model: string, tokens_in: number, tokens_out: number, cost_usd: number, raw_text: string } | { ok: false, error: string, fallback: true }>}
 */
export async function callModel(opts) {
  if (!isLlmAvailable()) {
    return {
      ok: false,
      error: 'ANTHROPIC_API_KEY not set or GRABBER_LLM=off',
      fallback: true,
    };
  }

  const model = opts.model || DEFAULT_CONSULTING_MODEL;
  const maxTokens = opts.maxTokens ?? 2048;

  let Anthropic;
  try {
    ({ default: Anthropic } = await import('@anthropic-ai/sdk'));
  } catch {
    try {
      Anthropic = require('@anthropic-ai/sdk');
    } catch (e) {
      return {
        ok: false,
        error: `SDK unavailable: ${e.message}`,
        fallback: true,
      };
    }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const schemaNote = opts.schemaHint
    ? `\n\nRespond with ONLY valid JSON matching this shape (no markdown):\n${opts.schemaHint}`
    : '\n\nRespond with ONLY valid JSON (no markdown fences).';

  try {
    const msg = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: opts.system,
      messages: [
        {
          role: 'user',
          content: `${opts.user}${schemaNote}`,
        },
      ],
    });

    const raw_text = (msg.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    const data = parseJsonLoose(raw_text);
    if (!data || typeof data !== 'object') {
      return {
        ok: false,
        error: 'LLM response was not valid JSON',
        fallback: true,
        raw_text,
      };
    }

    const tokens_in = msg.usage?.input_tokens ?? 0;
    const tokens_out = msg.usage?.output_tokens ?? 0;
    // Rough list-price placeholder for telemetry (not billing); override via env rates if needed
    const inRate = Number(process.env.GRABBER_LLM_IN_PER_MTOK || 3) / 1e6;
    const outRate = Number(process.env.GRABBER_LLM_OUT_PER_MTOK || 15) / 1e6;
    const cost_usd = tokens_in * inRate + tokens_out * outRate;

    return {
      ok: true,
      data,
      model: msg.model || model,
      tokens_in,
      tokens_out,
      cost_usd: Math.round(cost_usd * 1e6) / 1e6,
      raw_text,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      fallback: true,
    };
  }
}

function parseJsonLoose(text) {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function llmStatus() {
  return {
    available: isLlmAvailable(),
    model: DEFAULT_CONSULTING_MODEL,
    key_present: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    forced_off: process.env.GRABBER_LLM === '0' || process.env.GRABBER_LLM === 'off',
  };
}
