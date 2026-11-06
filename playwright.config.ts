import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [{
    command: "pnpm build:lib && pnpm --dir site dev --host 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: true,
    timeout: 120_000,
  }, {
    command: "pnpm exec vite --config tests/e2e/fixtures/vite.config.ts --host 127.0.0.1 --port 4322 --strictPort",
    url: "http://127.0.0.1:4322",
    reuseExistingServer: true,
    timeout: 30_000,
  }],
});
