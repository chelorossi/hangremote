import {
  expect,
  expectButtonLit,
  readSyncStorage,
  test,
  waitForContentScriptReady,
  waitForPopupReady,
} from "./support/extension-context.js";
import { FIXTURE_ORIGIN } from "./support/paths.js";

// Covers the popup -> content.js round trip for the mic/camera toggle
// buttons (src/js/extension.js sendToggle, src/js/content.js toggleElement,
// src/js/elements.js selectors) against both Meet screens content.js
// distinguishes between (splashScreen vs videocall — see
// content.js#detectScreen). Fixtures are minimal DOM built from the real
// attributes captured in src/js/*_snapshot_2025_01_17.html, served locally
// so the test doesn't depend on live Meet.
const SCREENS = [
  {
    name: "splashScreen",
    fixture: "splashscreen.html",
    controls: [
      { action: "toggleMic", popupSelector: "#div_mic", fixtureSelector: "#mic-button", initiallyMuted: "true" },
      { action: "toggleCam", popupSelector: "#div_cam", fixtureSelector: "#cam-button", initiallyMuted: "true" },
    ],
  },
  {
    name: "videocall",
    fixture: "videocall.html",
    controls: [
      { action: "toggleMic", popupSelector: "#div_mic", fixtureSelector: "#mic-button", initiallyMuted: "false" },
      { action: "toggleCam", popupSelector: "#div_cam", fixtureSelector: "#cam-button", initiallyMuted: "false" },
    ],
  },
];

for (const screen of SCREENS) {
  test.describe(`popup mic/cam toggle on ${screen.name}`, () => {
    for (const control of screen.controls) {
      // content.js's observerInit syncs the extension's stored toggle state
      // to the *real* button's current data-is-muted on first detection
      // (see content.js: `toggleMic: result.muteMicrophone || isMicMuted`).
      // So a fixture that starts muted makes the popup start in the "on"
      // (red) state before any click ever happens — clicking then turns it
      // off, not on. The expected before/after colors have to follow the
      // fixture's starting state, not assume "always starts off".
      const startsOn = control.initiallyMuted === "true";

      test(`${control.action} clicks the real Meet button and persists across popup reopen`, async ({
        context,
        extensionId,
        serviceWorker,
      }) => {
        const meetingTab = await context.newPage();
        await meetingTab.goto(`${FIXTURE_ORIGIN}/${screen.fixture}`);
        await waitForContentScriptReady(serviceWorker);

        const popup1 = await context.newPage();
        await popup1.goto(`chrome-extension://${extensionId}/src/popup.html`);

        const popupButton = popup1.locator(control.popupSelector);
        await expect(popupButton, `${control.popupSelector} not visible — no meeting tab was detected`).toBeVisible();
        await waitForPopupReady(popup1, control.popupSelector);
        await expectButtonLit(popup1, control.popupSelector, startsOn, "before any click");

        const fixtureButton = meetingTab.locator(control.fixtureSelector);
        await expect(fixtureButton).toHaveAttribute("data-is-muted", control.initiallyMuted);

        await popupButton.click();

        await expect(
          fixtureButton,
          `clicking ${control.popupSelector} in the popup never flipped data-is-muted on the real Meet button ` +
            `(${control.fixtureSelector}) — content.js/elements.js selector for "${screen.name}" may be wrong`
        ).not.toHaveAttribute("data-is-muted", control.initiallyMuted);

        await expectButtonLit(
          popup1,
          control.popupSelector,
          !startsOn,
          `${control.popupSelector} never switched visual state after the content-script round trip`
        );

        await popup1.close();

        const popup2 = await context.newPage();
        await popup2.goto(`chrome-extension://${extensionId}/src/popup.html`);
        await waitForPopupReady(popup2, control.popupSelector);
        await expectButtonLit(
          popup2,
          control.popupSelector,
          !startsOn,
          `${control.action} state did not persist via chrome.storage.sync across popup reopen`
        );

        // Assert the *key names*, not just what the popup renders. Every
        // writer of this state has at some point written the literal key
        // "item" instead of the item's name (extension.js, fixed in
        // 3855c9c; content.js:91). The popup reads back through the same
        // `item` variable, so a repaint-and-reopen check stays green while
        // the state rots under a junk key — only looking at storage
        // directly can catch it.
        const stored = await readSyncStorage(serviceWorker);
        expect(
          stored,
          "something wrote a literal \"item\" key to chrome.storage.sync instead of toggleMic/toggleCam"
        ).not.toHaveProperty("item");
        expect(
          stored[control.action],
          `${control.action} is not the key holding the toggle state in chrome.storage.sync`
        ).toBe(!startsOn);
      });
    }
  });
}
