import { test as base, chromium, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { TEST_BUILD_DIR } from "./paths.js";

export const test = base.extend({
  // Extensions require a persistent context launched headed — the default
  // Playwright `browser`/`context` fixtures can't load one, so this fixture
  // replaces `context` entirely.
  context: async ({}, use, testInfo) => {
    if (!fs.existsSync(path.join(TEST_BUILD_DIR, "manifest.json"))) {
      throw new Error(`No patched test extension at ${TEST_BUILD_DIR} — global setup should have produced it.`);
    }

    const userDataDir = testInfo.outputPath("user-data-dir");

    const context = await chromium.launchPersistentContext(userDataDir, {
      // Extensions don't register a service worker in Chromium's "new"
      // headless mode (verified empirically against this project's
      // Chromium build), so this must stay headed. Positioning the window
      // off any real display keeps it out of the way without losing that.
      headless: false,
      args: [
        `--disable-extensions-except=${TEST_BUILD_DIR}`,
        `--load-extension=${TEST_BUILD_DIR}`,
        "--window-position=-32000,-32000",
        "--window-size=1024,768",
      ],
    });

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) {
      worker = await context.waitForEvent("serviceworker", { timeout: 10_000 }).catch(() => null);
    }
    if (!worker) {
      throw new Error(
        `The extension never registered a service worker — check that ${path.join(TEST_BUILD_DIR, "manifest.json")} is valid and loadable.`
      );
    }
    await use(worker.url().split("/")[2]);
  },
});

export { expect };
