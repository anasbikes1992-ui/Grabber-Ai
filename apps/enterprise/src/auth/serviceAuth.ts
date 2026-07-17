import { timingSafeEqual } from "node:crypto";

export function extractBearerToken(authHeader: string | null) {
  if (!authHeader) return "";

  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token) return "";
  if (scheme.toLowerCase() !== "bearer") return "";

  return token.trim();
}

export function isValidServiceApiKey(reqHeaders: Headers) {
  const sharedKey = process.env.ENTERPRISE_API_KEY?.trim() || "";
  if (!sharedKey) {
    return false;
  }

  const headerKey = reqHeaders.get("x-enterprise-api-key")?.trim() || "";
  const bearerToken = extractBearerToken(reqHeaders.get("authorization"));
  const candidates = [headerKey, bearerToken].filter(Boolean);

  for (const candidate of candidates) {
    if (constantTimeEqual(candidate, sharedKey)) {
      return true;
    }
  }

  return false;
}

function constantTimeEqual(candidate: string, secret: string) {
  const candidateBuffer = Buffer.from(candidate);
  const secretBuffer = Buffer.from(secret);

  if (candidateBuffer.length !== secretBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, secretBuffer);
}
