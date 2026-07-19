import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "";
const PASSWORD = process.env.E2E_PASSWORD ?? "";

test.skip(!EMAIL || !PASSWORD, "Set E2E_EMAIL and E2E_PASSWORD (owner) to run this test.");

const CONSOLE_PAGES: { path: string; expectText: string }[] = [
  { path: "/command-center", expectText: "Command Center" },
  { path: "/kpis", expectText: "Business KPIs" },
  { path: "/business", expectText: "Business OS" },
  { path: "/governance", expectText: "Delivery Governance" },
  { path: "/clients", expectText: "Clients & registrations" },
  { path: "/settings", expectText: "Settings & monitoring" },
  { path: "/ops", expectText: "Operations" },
  { path: "/delivery", expectText: "Delivery" },
  { path: "/marketing", expectText: "Marketing" },
];

test("owner console smoke: every sidebar page renders after login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/command-center/, { timeout: 20_000 });

  for (const { path, expectText } of CONSOLE_PAGES) {
    await page.goto(path);
    await expect(page.getByText(expectText).first()).toBeVisible({ timeout: 15_000 });
    // No unauthorized bounce and no raw error surface
    expect(page.url()).toContain(path);
    await expect(page.getByText("Application error", { exact: false })).toHaveCount(0);
  }
});

test("logged-out console access redirects to login", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/command-center");
  await page.waitForURL(/\/login/, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await ctx.close();
});
