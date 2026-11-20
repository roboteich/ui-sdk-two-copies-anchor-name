import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "tests",
  globalSetup: "./tests/build.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  expect: { timeout: 2_000 },
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1200, height: 800 },
    // Set CHROME_PATH to use an installed Chrome instead of Playwright's Chromium.
    launchOptions: { executablePath: process.env.CHROME_PATH || undefined },
  },
})
