import { redirect } from "next/navigation";
import { EnterpriseShell } from "@/components/shell";
import { JarvisVoiceDock } from "@/components/jarvis-voice-dock";
import { getSessionUser } from "@/lib/auth/session";

// Auth gate reads cookies — must evaluate per request, never prerender.
export const dynamic = "force-dynamic";

/**
 * Owner console gate. Only admins reach the internal Business OS.
 * Clients are routed to their portal; anonymous visitors to /login.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/portal");

  return (
    <>
      <EnterpriseShell>{children}</EnterpriseShell>
      <JarvisVoiceDock />
    </>
  );
}
