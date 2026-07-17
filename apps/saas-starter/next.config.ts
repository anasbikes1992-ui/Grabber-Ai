import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Monorepo: keep Turbopack rooted on this app, not the parent lockfile.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
