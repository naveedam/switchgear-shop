import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end smoke tests against a deployed site.
 *   E2E_BASE_URL=https://www.switchgearshop.in npx playwright test
 * In CI they run against the Vercel preview URL of each pull request.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://www.switchgearshop.in",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec/ },
  ],
});
