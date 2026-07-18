import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Integration = {
  key: string;
  label: string;
  group: "Core" | "AI providers" | "Delivery" | "Payments" | "Email";
  purpose: string;
  required: boolean;
  configured: boolean;
};

function has(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function GET() {
  const user = await getSessionUser();
  if (user?.role !== "admin") {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const supabaseConfigured = Boolean(getSupabaseUrl() && getSupabaseAnonKey());

  const integrations: Integration[] = [
    // Core
    { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL", group: "Core", purpose: "Auth & data project URL", required: true, configured: Boolean(getSupabaseUrl()) },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase anon/publishable key", group: "Core", purpose: "Public auth client key", required: true, configured: Boolean(getSupabaseAnonKey()) },
    { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role", group: "Core", purpose: "Admin ops (list/manage users)", required: true, configured: has("SUPABASE_SERVICE_ROLE_KEY") },
    { key: "SUPABASE_JWT_SECRET", label: "Supabase JWT secret", group: "Core", purpose: "Verify API bearer tokens", required: true, configured: has("SUPABASE_JWT_SECRET") },
    { key: "OWNER_EMAIL", label: "Owner email(s)", group: "Core", purpose: "Admin console allowlist", required: true, configured: has("OWNER_EMAIL") },
    { key: "CORS_ORIGINS", label: "Allowed origins", group: "Core", purpose: "Locks the API to your domain", required: false, configured: has("CORS_ORIGINS") || has("ALLOWED_ORIGINS") },
    // AI providers
    { key: "ANTHROPIC_API_KEY", label: "Anthropic (Claude)", group: "AI providers", purpose: "Jarvis consulting reasoning", required: true, configured: has("ANTHROPIC_API_KEY") },
    { key: "OPENAI_API_KEY", label: "OpenAI", group: "AI providers", purpose: "Alternate model provider", required: false, configured: has("OPENAI_API_KEY") },
    { key: "GEMINI_API_KEY", label: "Google Gemini", group: "AI providers", purpose: "Alternate model provider", required: false, configured: has("GEMINI_API_KEY") },
    { key: "ELEVENLABS_API_KEY", label: "ElevenLabs", group: "AI providers", purpose: "Premium Jarvis voice", required: false, configured: has("ELEVENLABS_API_KEY") },
    // Delivery
    { key: "GITHUB_TOKEN", label: "GitHub", group: "Delivery", purpose: "Repo automation for delivery", required: false, configured: has("GITHUB_TOKEN") },
    { key: "VERCEL_TOKEN", label: "Vercel", group: "Delivery", purpose: "Deploy automation", required: false, configured: has("VERCEL_TOKEN") },
    { key: "SUPABASE_STORAGE_BUCKET", label: "Storage bucket", group: "Delivery", purpose: "Client documents & assets", required: false, configured: has("SUPABASE_STORAGE_BUCKET") },
    // Payments
    { key: "STRIPE_SECRET_KEY", label: "Stripe", group: "Payments", purpose: "Client deposit checkout", required: false, configured: has("STRIPE_SECRET_KEY") },
    { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook", group: "Payments", purpose: "Verifies payment events", required: false, configured: has("STRIPE_WEBHOOK_SECRET") },
    { key: "NEXT_PUBLIC_APP_URL", label: "App URL", group: "Payments", purpose: "Checkout return address", required: false, configured: has("NEXT_PUBLIC_APP_URL") },
    // Email
    { key: "RESEND_API_KEY", label: "Resend", group: "Email", purpose: "Receipts & notifications", required: false, configured: has("RESEND_API_KEY") },
    { key: "EMAIL_FROM", label: "Sender address", group: "Email", purpose: "Verified from address", required: false, configured: has("EMAIL_FROM") },
  ];

  const llm = {
    available: has("ANTHROPIC_API_KEY") && process.env.GRABBER_LLM !== "0" && process.env.GRABBER_LLM !== "off",
    model: process.env.GRABBER_LLM_MODEL || "claude-sonnet-5",
    key_present: has("ANTHROPIC_API_KEY"),
  };

  // Durable-store health: can we reach the engagements + deposits tables?
  let durableStore = { engagements: false, deposits: false };
  if (has("SUPABASE_SERVICE_ROLE_KEY")) {
    try {
      const { getSupabaseAdminClient } = await import("@/lib/production/supabase");
      const supabase = getSupabaseAdminClient() as unknown as {
        from: (t: string) => {
          select: (c: string, o: { count: "exact"; head: true }) => Promise<{ error: unknown }>;
        };
      };
      const [e, d] = await Promise.all([
        supabase.from("engagements").select("id", { count: "exact", head: true }),
        supabase.from("deposits").select("engagement_id", { count: "exact", head: true }),
      ]);
      durableStore = { engagements: !e.error, deposits: !d.error };
    } catch {
      // leave false — surfaced in the UI
    }
  }

  const system = {
    environment: process.env.NODE_ENV || "development",
    region: process.env.VERCEL_REGION || "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    supabase_configured: supabaseConfigured,
    durable_store: durableStore,
  };

  return Response.json({ ok: true, integrations, llm, system });
}
