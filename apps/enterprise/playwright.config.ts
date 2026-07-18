import { defineConfig, devices } from "@playwright/test";

/**
 * Client-journey e2e. Credentials come from env (never hardcoded):
 *   BASE_URL              default https://enterprise-ruby.vercel.app
 *   E2E_EMAIL             the account to sign in as
 *   E2E_PASSWORD          its password
 *   E2E_CLIENT_NAME       (owner runs) the client engagement to open in the portal
 *
 * Run:  E2E_EMAIL=you@x.com E2E_PASSWORD=… npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "https://enterprise-ruby.vercel.app",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
});
