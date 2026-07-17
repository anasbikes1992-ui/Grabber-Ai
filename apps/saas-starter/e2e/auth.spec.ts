import { test, expect } from "@playwright/test";

test("home shows demo banner when Supabase unset", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("demo-banner")).toBeVisible();
  await expect(page.getByTestId("go-login")).toBeVisible();
});

test("demo login reaches dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("email").fill("owner@example.com");
  await page.getByTestId("password").fill("secret12");
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("dashboard")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("user-email")).toContainText("owner@example.com");
  await expect(page.getByTestId("auth-mode")).toContainText("Demo auth");
});
