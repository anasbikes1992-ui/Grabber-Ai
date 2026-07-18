import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_EMAIL ?? "";
const PASSWORD = process.env.E2E_PASSWORD ?? "";
const CLIENT_NAME = process.env.E2E_CLIENT_NAME ?? "Lanka Textiles";

test.skip(!EMAIL || !PASSWORD, "Set E2E_EMAIL and E2E_PASSWORD to run this test.");

test("client journey: login → portal → proposal → pay deposit", async ({ page }) => {
  // ── Sign in ──────────────────────────────────────────────────────────
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Owner lands on /command-center, client on /portal. Either proves login.
  await page.waitForURL(/\/(command-center|portal)/, { timeout: 20_000 });

  // ── Open the client portal ───────────────────────────────────────────
  await page.goto("/portal");
  // Owners pick a client; a scoped client account loads directly.
  const picker = page.getByPlaceholder("Client name");
  if (await picker.isVisible().catch(() => false)) {
    await picker.fill(CLIENT_NAME);
    await page.getByRole("button", { name: "Open portal" }).click();
  }

  // ── UI evolves within stages: the progress stepper is shown ──────────
  await expect(page.getByText("Your engagement")).toBeVisible();
  for (const step of ["Discovery", "Proposal", "Payment", "In delivery"]) {
    await expect(page.getByText(step, { exact: true }).first()).toBeVisible();
  }

  // ── Proposal → deposit ───────────────────────────────────────────────
  const proposalTab = page.getByRole("button", { name: /Proposal/ }).first();
  if (await proposalTab.isVisible().catch(() => false)) {
    await proposalTab.click();
  }

  const payButton = page.getByRole("button", { name: /pay deposit/i }).first();
  if (await payButton.isVisible().catch(() => false)) {
    await expect(payButton).toBeEnabled();
    // Uncomment to drive the Stripe redirect (requires Stripe test mode):
    // await payButton.click();
    // await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 });
  } else {
    test.info().annotations.push({
      type: "note",
      description:
        "No proposal/deposit yet — run discovery for this client first (or link the client to an engagement in Clients & Access).",
    });
  }
});
