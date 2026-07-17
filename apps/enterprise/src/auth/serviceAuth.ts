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
  const encoder = new TextEncoder();
  const candidateBytes = encoder.encode(candidate);
  const secretBytes = encoder.encode(secret);

  if (candidateBytes.length !== secretBytes.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < candidateBytes.length; i += 1) {
    diff |= candidateBytes[i] ^ secretBytes[i];
  }

  return diff === 0;
}
