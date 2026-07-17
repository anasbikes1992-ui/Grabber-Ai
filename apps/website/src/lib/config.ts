/** Public surface config — customer never talks to factory ports directly. */

export const ENTERPRISE_URL =
  process.env.NEXT_PUBLIC_ENTERPRISE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3002";

export const JARVIS_URL =
  process.env.NEXT_PUBLIC_JARVIS_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3001";

export const SITE_NAME = "Grabber AI Studio";
export const SITE_TAGLINE =
  "From business challenge to production software—guided by AI consulting, governed delivery, and a deterministic software factory.";
export const SITE_TAGLINE_SIMPLE =
  "We don't just build software. We engineer better businesses.";
