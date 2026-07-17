"use client";

import { CommandBar } from "./command-bar";
import { Sidebar } from "./sidebar";
import { AiHub } from "./ai-hub";
import { Timeline } from "./timeline";
import { ParticleField } from "./particle-field";

export function JarvisShell({
  children,
  factoryOnline,
  factoryUrl,
}: {
  children: React.ReactNode;
  factoryOnline: boolean;
  factoryUrl: string;
}) {
  return (
    <div className="jarvis-bg relative flex h-screen flex-col overflow-hidden">
      <ParticleField />
      <CommandBar factoryOnline={factoryOnline} factoryUrl={factoryUrl} />
      <div className="relative flex min-h-0 flex-1">
        <Sidebar />
        <main className="jarvis-scroll relative z-0 min-w-0 flex-1 overflow-y-auto p-5 md:p-6">
          {children}
        </main>
        <AiHub />
      </div>
      <Timeline />
    </div>
  );
}
