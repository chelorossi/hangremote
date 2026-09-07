import { expect, expectButtonLit, test, waitForPopupReady } from "./support/extension-context.js";
import { FIXTURE_ORIGIN, UNINJECTED_FIXTURE } from "./support/paths.js";

// Covers src/js/extension.js sendToggle()'s failure path. The popup paints
// optimistically on click and only afterwards learns whether the message
// reached the content script; when it didn't, it reverts systemState and has
// to repaint. f_install_clicks passes ($tagDiv, $tagSpan) along for exactly
// that repaint, and sendToggle used to accept only (button) — so the state
// silently reverted while the button stayed lit, and the popup went on
// claiming a mic state the meeting never received until it was reopened.
//
// The tab here matches the manifest (so chrome.tabs.query finds it and the
// popup offers its controls) but has no content script listening, so
// chrome.tabs.sendMessage sets runtime.lastError. See global-setup.js.
test.describe("popup recovers when the content script is unreachable", () => {
  test("a toggle that never reaches the content script repaints the button instead of leaving it lit", async ({
    context,
    extensionId,
  }) => {
    const meetingTab = await context.newPage();
    await meetingTab.goto(`${FIXTURE_ORIGIN}/${UNINJECTED_FIXTURE}`);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup.html`);

    const popupMic = popup.locator("#div_mic");
    await expect(
      popupMic,
      "#div_mic not visible — the popup did not treat the uninjected fixture as a meeting tab, so the failure path was never reached"
    ).toBeVisible();
    await waitForPopupReady(popup, "#div_mic");
    await expectButtonLit(popup, "#div_mic", false, "#div_mic started lit before anything was clicked");

    // Paints red synchronously inside the click handler; the send failure
    // arrives afterwards, and only then can the button be put back.
    await popupMic.click();

    // Read the popup's own state first. Nothing ever wrote toggleMic to
    // storage for this tab, so the popup loaded with systemState.toggleMic
    // === undefined; it only becomes the boolean false by being flipped true
    // on click and then reverted when the send fails. Asserting on that
    // makes it impossible for this test to pass because the click quietly
    // did nothing — which is the failure mode that would otherwise make the
    // repaint assertion below meaningless.
    await expect
      .poll(
        () => popup.evaluate(() => systemState.toggleMic), // eslint-disable-line no-undef
        {
          message:
            "systemState.toggleMic never round-tripped true -> false, so the click never reached sendToggle's " +
            "runtime.lastError branch and this test would not be exercising the repaint at all",
        }
      )
      .toBe(false);

    // systemState going false already means the lastError branch ran, and the
    // repaint lives in that same synchronous block — so this is a settled
    // check, not a race against one.
    await expectButtonLit(
      popup,
      "#div_mic",
      false,
      "the popup left #div_mic lit after chrome.tabs.sendMessage failed — sendToggle reverted systemState " +
        "but never repainted, so the popup shows a mic state the meeting never received"
    );
  });
});
