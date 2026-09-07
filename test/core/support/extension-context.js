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

  serviceWorker: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) {
      worker = await context.waitForEvent("serviceworker", { timeout: 10_000 }).catch(() => null);
    }
    if (!worker) {
      throw new Error(
        `The extension never registered a service worker — check that ${path.join(TEST_BUILD_DIR, "manifest.json")} is valid and loadable.`
      );
    }
    await use(worker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(serviceWorker.url().split("/")[2]);
  },
});

// content.js's observerInit does its real work *asynchronously*: it attaches
// the per-button data-is-muted listeners and writes toggleMic/toggleCam from
// inside the callback of a chrome.storage.sync.get (content.js:31-55). A
// fixture flag set alongside the DOM mutation that *triggers* observerInit is
// therefore already true before any of that has happened, and waiting on it
// races the listeners into existence — clicking a Meet button in that window
// silently does nothing, failing a test whose production code is fine.
//
// The storage write is the last thing observerInit does before disconnecting,
// so both keys being present is the one signal that means "content.js is
// fully wired up". Read it from the extension's own service worker, since
// that is the only context that can see chrome.storage.
export async function waitForContentScriptReady(serviceWorker, timeout = 10_000) {
  await serviceWorker.evaluate(async (deadline) => {
    const startedAt = Date.now();
    for (;;) {
      const state = await chrome.storage.sync.get(["toggleMic", "toggleCam"]);
      if (state.toggleMic !== undefined && state.toggleCam !== undefined) {
        return;
      }
      if (Date.now() - startedAt > deadline) {
        throw new Error(
          "content.js's observerInit never wrote toggleMic/toggleCam to chrome.storage.sync — " +
            "its screen/button detection never completed, so no data-is-muted listeners are attached"
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }, timeout);
}

// The popup has the same shape of race as content.js: f_install_clicks —
// which both paints the button and attaches its click handler — runs inside
// the callback of a chrome.storage.sync.get (extension.js:61-73). A click
// dispatched before that lands silently does nothing, which quietly turns a
// "button ends up in the right state" assertion into one that passes because
// nothing ever happened. updateButton sets the colours as inline styles, so
// the style attribute going from empty to set is the moment the handler
// exists.
export async function waitForPopupReady(popup, selector) {
  await popup.waitForFunction(
    (sel) => document.querySelector(sel)?.style.backgroundColor !== "",
    selector,
    { timeout: 10_000 }
  );
}

export const ON_COLOR = "rgb(255, 82, 82)";

// updateButton() paints by writing inline styles (extension.js:14-23), but
// popup.css transitions background-color over ~250ms, so the *computed*
// colour spends that window at an intermediate rgba() matching neither
// state. `not.toHaveCSS(ON_COLOR)` is therefore satisfied by a button that is
// merely on its way to red, which lets "the button ended up off" pass for a
// button that stayed on — measured: a popup left lit by a failed send reads
// as rgba(251, 229, 229, 0.72) 25ms after the click. Assert what updateButton
// actually wrote instead of what the compositor is showing mid-animation.
export async function expectButtonLit(popup, selector, lit, message) {
  const painted = () => popup.evaluate((sel) => document.querySelector(sel).style.backgroundColor, selector);
  if (lit) {
    await expect.poll(painted, { message }).toBe(ON_COLOR);
  } else {
    await expect.poll(painted, { message }).not.toBe(ON_COLOR);
  }
}

// Everything the extension has persisted, so tests can assert on the actual
// key names rather than only on what the popup happens to render.
export async function readSyncStorage(serviceWorker) {
  return serviceWorker.evaluate(() => chrome.storage.sync.get(null));
}

export { expect };
