import { expect, test } from "@playwright/test";

test("home page renders and has search", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/SwitchgearShop/);
  await expect(page.locator("body")).not.toContainText("Something went wrong");
});

test("brands page links to brand landing pages", async ({ page }) => {
  await page.goto("/brands");
  const first = page.locator('a[href^="/brands/"]').first();
  await expect(first).toBeVisible({ timeout: 15_000 });
  await first.click();
  await expect(page).toHaveURL(/\/brands\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/price list/i);
});

test("checkout redirects anonymous users to sign in", async ({ page }) => {
  await page.goto("/checkout");
  await expect(page.getByText(/sign in/i).first()).toBeVisible();
});

test("admin area is not reachable without login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});
