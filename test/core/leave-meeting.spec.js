import { expect, test, waitForContentScriptReady } from "./support/extension-context.js";
import { FIXTURE_ORIGIN } from "./support/paths.js";

// Covers src/js/extension.js sendToggle()'s "togglePhone" branch: clicking
// the popup's phone icon closes the meeting tab via chrome.tabs.remove.
// This is the popup-driven equivalent of the "leaveMeeting" keyboard
// command in background.js; the keyboard-shortcut path itself isn't
// covered here because Playwright/CDP has no API to dispatch
// chrome.commands.onCommand — only the popup UI entry point is testable.
test.describe("leave meeting", () => {
  test("clicking the popup phone icon closes the meeting tab", async ({ context, extensionId, serviceWorker }) => {
    const meetingTab = await context.newPage();
    await meetingTab.goto(`${FIXTURE_ORIGIN}/videocall.html`);
    await waitForContentScriptReady(serviceWorker);

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup.html`);

    await expect(popup.locator("#div_phone")).toBeVisible();

    // chrome.tabs.remove() is near-instant once dispatched, so the tab can
    // close before an awaited click() even resolves — register the close
    // listener together with the click, not after it, or the event can be
    // missed entirely.
    await Promise.all([meetingTab.waitForEvent("close", { timeout: 5_000 }), popup.locator("#div_phone").click()]);
    expect(meetingTab.isClosed(), "clicking the phone icon did not close the meeting tab").toBe(true);
  });
});
