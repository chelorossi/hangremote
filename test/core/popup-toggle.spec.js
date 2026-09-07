import { expect, test } from "./support/extension-context.js";
import { FIXTURE_ORIGIN } from "./support/paths.js";

// Covers the popup -> content.js round trip for the mic/camera toggle
// buttons (src/js/extension.js sendToggle, src/js/content.js toggleElement,
// src/js/elements.js selectors) against both Meet screens content.js
// distinguishes between (splashScreen vs videocall — see
// content.js#detectScreen). Fixtures are minimal DOM built from the real
// attributes captured in src/js/*_snapshot_2025_01_17.html, served locally
// so the test doesn't depend on live Meet.
const ON_COLOR = "rgb(255, 82, 82)";

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
      }) => {
        const meetingTab = await context.newPage();
        await meetingTab.goto(`${FIXTURE_ORIGIN}/${screen.fixture}`);
        // Wait for #ready2, not just #ready: observerInit (which runs this
        // storage sync) only attaches on the *second* post-load mutation —
        // see the fixture files for why. Waiting for #ready alone would
        // race the storage write above.
        await expect(
          meetingTab.locator("#ready2"),
          "fixture page's observerInit cycle never completed — content.js's MutationObserver-based screen/button detection needs two DOM mutations to fully run"
        ).toHaveAttribute("data-ready", "true", { timeout: 5_000 });

        const popup1 = await context.newPage();
        await popup1.goto(`chrome-extension://${extensionId}/src/popup.html`);

        const popupButton = popup1.locator(control.popupSelector);
        await expect(popupButton, `${control.popupSelector} not visible — no meeting tab was detected`).toBeVisible();
        await expectPopupOn(popupButton, startsOn, "before any click");

        const fixtureButton = meetingTab.locator(control.fixtureSelector);
        await expect(fixtureButton).toHaveAttribute("data-is-muted", control.initiallyMuted);

        await popupButton.click();

        await expect(
          fixtureButton,
          `clicking ${control.popupSelector} in the popup never flipped data-is-muted on the real Meet button ` +
            `(${control.fixtureSelector}) — content.js/elements.js selector for "${screen.name}" may be wrong`
        ).not.toHaveAttribute("data-is-muted", control.initiallyMuted);

        await expectPopupOn(
          popupButton,
          !startsOn,
          `${control.popupSelector} never switched visual state after the content-script round trip`
        );

        await popup1.close();

        const popup2 = await context.newPage();
        await popup2.goto(`chrome-extension://${extensionId}/src/popup.html`);
        await expectPopupOn(
          popup2.locator(control.popupSelector),
          !startsOn,
          `${control.action} state did not persist via chrome.storage.sync across popup reopen`
        );
      });
    }
  });
}

async function expectPopupOn(locator, on, message) {
  if (on) {
    await expect(locator, message).toHaveCSS("background-color", ON_COLOR);
  } else {
    await expect(locator, message).not.toHaveCSS("background-color", ON_COLOR);
  }
}
