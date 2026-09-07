import { expect, test } from "./support/extension-context.js";
import { FIXTURE_ORIGIN } from "./support/paths.js";

// Covers content.js's *other* sync path: attachListener()/observerInit,
// which watches the real Meet mic/cam buttons for data-is-muted attribute
// changes and reports them back via `updateState`, independent of whether
// the extension itself triggered the change. This is what keeps the popup
// truthful when the user (or Meet itself) mutes/unmutes from inside the
// meeting UI rather than through the extension — a real desync the user
// has hit in prod before. popup-toggle.spec.js only covers the other
// direction (popup -> Meet); this covers Meet -> popup.
const ON_COLOR = "rgb(255, 82, 82)";

test.describe("popup stays in sync with Meet-initiated changes", () => {
  test("clicking the real Meet mic button directly (not via the popup) still updates the popup", async ({
    context,
    extensionId,
  }) => {
    const meetingTab = await context.newPage();
    await meetingTab.goto(`${FIXTURE_ORIGIN}/videocall.html`);

    // #ready2 confirms content.js's *second* MutationObserver cycle ran —
    // the one that actually attaches the attribute-change listeners onto
    // the mic/cam buttons (see videocall.html for why one mutation isn't
    // enough).
    await expect(
      meetingTab.locator("#ready2"),
      "content.js's observerInit never attached its data-is-muted listeners — the fixture's second mutation may not have registered in time"
    ).toHaveAttribute("data-ready", "true", { timeout: 5_000 });

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup.html`);

    const popupMic = popup.locator("#div_mic");
    await expect(popupMic).toBeVisible();
    await expect(popupMic).not.toHaveCSS("background-color", ON_COLOR);

    // This is the key difference from popup-toggle.spec.js: click Meet's
    // own button directly on the meeting tab, never touching the popup.
    await meetingTab.locator("#mic-button").click();

    await expect(
      popupMic,
      "the popup never reflected a mic state change that happened directly on the Meet button — " +
        "it would show stale state if the user muted from inside Meet instead of the extension"
    ).toHaveCSS("background-color", ON_COLOR);
  });
});
