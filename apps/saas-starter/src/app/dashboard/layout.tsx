import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getSessionUser } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const env = getPublicEnv();

  return (
    <DashboardShell user={user} appName={env.appName}>
      {children}
    </DashboardShell>
  );
}
