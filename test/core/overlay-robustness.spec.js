import { expect, test } from "./support/extension-context.js";
import { FIXTURE_ORIGIN } from "./support/paths.js";

// Real Meet is never static — banners ("You're presenting"), toasts,
// reaction animations, and dialogs constantly get added/removed from the
// DOM during a call. content.js's screen/button detection runs off a
// MutationObserver that fires on *every* childList mutation anywhere in
// <body> (see content.js observeDOM()), so unrelated churn like that is a
// real risk of confusing detectScreen() or losing track of the mic/cam
// buttons — something that has happened in prod before, if rarely. This
// pumps a batch of unrelated add/remove mutations (simulating an overlay
// appearing and disappearing) before exercising the ordinary popup-driven
// toggle flow, to prove that churn alone doesn't break it.
const ON_COLOR = "rgb(255, 82, 82)";

test.describe("MutationObserver survives unrelated DOM churn", () => {
  test("an overlay/banner appearing and disappearing doesn't break mic toggle detection", async ({
    context,
    extensionId,
  }) => {
    const meetingTab = await context.newPage();
    await meetingTab.goto(`${FIXTURE_ORIGIN}/videocall.html`);
    await expect(meetingTab.locator("#ready2")).toHaveAttribute("data-ready", "true", { timeout: 5_000 });

    // Simulate an overlay banner (e.g. "You're presenting to everyone")
    // appearing, sitting for a moment, then going away — several childList
    // mutations with no data-present-landing/data-panel-id of their own,
    // same as real Meet toasts/banners.
    await meetingTab.evaluate(async () => {
      const overlay = document.createElement("div");
      overlay.setAttribute("role", "alert");
      overlay.textContent = "You're presenting to everyone";
      document.body.appendChild(overlay);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const nested = document.createElement("span");
      overlay.appendChild(nested);
      await new Promise((resolve) => setTimeout(resolve, 50));

      overlay.remove();
    });

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup.html`);

    const popupMic = popup.locator("#div_mic");
    await expect(popupMic).toBeVisible();
    await expect(popupMic).not.toHaveCSS("background-color", ON_COLOR);

    const fixtureMic = meetingTab.locator("#mic-button");
    await expect(fixtureMic).toHaveAttribute("data-is-muted", "false");

    await popupMic.click();

    await expect(
      fixtureMic,
      "after unrelated DOM churn (an overlay appearing/disappearing), the popup click no longer reached " +
        "the real Meet mic button — content.js's screen/button detection may have gotten confused by it"
    ).toHaveAttribute("data-is-muted", "true");
    await expect(popupMic).toHaveCSS("background-color", ON_COLOR);
  });
});
