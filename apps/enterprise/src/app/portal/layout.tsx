import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

// Auth gate reads cookies — must evaluate per request, never prerender.
export const dynamic = "force-dynamic";

/**
 * Client portal gate. Requires a signed-in session (client or admin).
 * Anonymous visitors are sent to /login. Per-engagement scoping for
 * client accounts is applied within the portal view.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <>{children}</>;
}
