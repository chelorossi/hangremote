import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FIXTURE_ORIGIN, OUTPUT_DIR } from "./support/paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: __dirname,
  testMatch: "**/*.spec.js",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: OUTPUT_DIR,
  globalSetup: path.resolve(__dirname, "global-setup.js"),
  webServer: {
    command: `node ${path.resolve(__dirname, "support/serve-fixtures.js")}`,
    url: `${FIXTURE_ORIGIN}/splashscreen.html`,
    reuseExistingServer: false,
    timeout: 10_000,
  },
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
