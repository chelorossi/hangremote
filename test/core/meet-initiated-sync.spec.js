import { expect, expectButtonLit, test, waitForContentScriptReady } from "./support/extension-context.js";
import { FIXTURE_ORIGIN } from "./support/paths.js";

// Covers content.js's *other* sync path: attachListener()/observerInit,
// which watches the real Meet mic/cam buttons for data-is-muted attribute
// changes and reports them back via `updateState`, independent of whether
// the extension itself triggered the change. This is what keeps the popup
// truthful when the user (or Meet itself) mutes/unmutes from inside the
// meeting UI rather than through the extension — a real desync the user
// has hit in prod before. popup-toggle.spec.js only covers the other
// direction (popup -> Meet); this covers Meet -> popup.
test.describe("popup stays in sync with Meet-initiated changes", () => {
  test("clicking the real Meet mic button directly (not via the popup) still updates the popup", async ({
    context,
    extensionId,
    serviceWorker,
  }) => {
    const meetingTab = await context.newPage();
    await meetingTab.goto(`${FIXTURE_ORIGIN}/videocall.html`);

    // This test clicks the Meet button directly, so it depends entirely on
    // observerInit having attached its data-is-muted listeners first —
    // exactly the thing a DOM-side ready flag cannot tell us.
    await waitForContentScriptReady(serviceWorker);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup.html`);

    const popupMic = popup.locator("#div_mic");
    await expect(popupMic).toBeVisible();
    await expectButtonLit(popup, "#div_mic", false, "#div_mic started lit before the Meet button was touched");

    // This is the key difference from popup-toggle.spec.js: click Meet's
    // own button directly on the meeting tab, never touching the popup.
    await meetingTab.locator("#mic-button").click();

    await expectButtonLit(
      popup,
      "#div_mic",
      true,
      "the popup never reflected a mic state change that happened directly on the Meet button — " +
        "it would show stale state if the user muted from inside Meet instead of the extension"
    );
  });
});
