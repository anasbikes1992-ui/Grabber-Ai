import { JarvisShell } from "@/components/shell/jarvis-shell";
import { factoryBaseUrl, loadJarvisFactoryData } from "@/lib/factory-client";

export const dynamic = "force-dynamic";

export default async function JarvisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = await loadJarvisFactoryData();
  return (
    <JarvisShell
      factoryOnline={status.online}
      factoryUrl={status.baseUrl || factoryBaseUrl()}
    >
      {children}
    </JarvisShell>
  );
}
