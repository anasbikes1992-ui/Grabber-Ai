export type AiProvider = "anthropic" | "openai" | "gemini" | "ollama";

export type AiGatewayInput = {
  prompt: string;
  provider?: AiProvider;
  model?: string;
  temperature?: number;
};

export type AiGatewayOutput = {
  provider: AiProvider;
  model: string;
  content: string;
};

/**
 * Provider-agnostic AI gateway entrypoint.
 * Enterprise 1.0 keeps Anthropic as default and can route by config later.
 */
export async function runAi(input: AiGatewayInput): Promise<AiGatewayOutput> {
  if (process.env.NODE_ENV === "production" && process.env.AI_GATEWAY_ENABLED !== "1") {
    throw new Error("AI gateway is not configured for production");
  }

  const provider: AiProvider = input.provider || "anthropic";
  const model = input.model || process.env.AI_GATEWAY_DEFAULT_MODEL || "claude-sonnet-5";

  // Placeholder deterministic response so callers can integrate now.
  // Runtime provider adapters can replace this without API changes.
  return {
    provider,
    model,
    content: `AI gateway stub response (${provider}:${model})`,
  };
}
