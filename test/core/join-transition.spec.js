import { expect, expectButtonLit, test, waitForPopupReady } from "./support/extension-context.js";
import { FIXTURE_ORIGIN } from "./support/paths.js";

// Entering the call re-applies the mic/cam defaults: the checkboxes win over
// whatever the user left the pre-join controls set to. Meet rebuilds the
// controls as fresh nodes on that transition, so this also covers content.js
// re-wiring onto the new buttons — listeners attached on the pre-join screen
// are on detached nodes afterwards.
test.describe("joining the call", () => {
  test("the mic/cam defaults win over a manual change made on the pre-join screen", async ({
    context,
    serviceWorker,
  }) => {
    await serviceWorker.evaluate(() => chrome.storage.sync.set({ muteMicrophone: true, muteCamera: true }));

    const meetingTab = await context.newPage();
    await meetingTab.goto(`${FIXTURE_ORIGIN}/join-transition.html`);

    const mic = meetingTab.locator("#mic-button");
    await expect(mic, "the default was never applied on the pre-join screen").toHaveAttribute(
      "data-is-muted",
      "true",
      { timeout: 10_000 }
    );

    // The user deliberately unmutes before joining.
    await mic.click();
    await expect(mic).toHaveAttribute("data-is-muted", "false");

    await meetingTab.evaluate(() => window.join());

    await expect(
      meetingTab.locator("#mic-button"),
      "the mic stayed unmuted after joining — the muteMicrophone default did not win over the manual " +
        "pre-join change, so the user enters the call live"
    ).toHaveAttribute("data-is-muted", "true", { timeout: 10_000 });
    await expect(
      meetingTab.locator("#cam-button"),
      "the camera stayed on after joining — same cause as the mic"
    ).toHaveAttribute("data-is-muted", "true", { timeout: 10_000 });
  });

  test("an open popup follows the state change instead of going stale", async ({
    context,
    extensionId,
    serviceWorker,
  }) => {
    await serviceWorker.evaluate(() => chrome.storage.sync.set({ muteMicrophone: true, muteCamera: true }));

    const meetingTab = await context.newPage();
    await meetingTab.goto(`${FIXTURE_ORIGIN}/join-transition.html`);
    await expect(meetingTab.locator("#mic-button")).toHaveAttribute("data-is-muted", "true", { timeout: 10_000 });

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup.html`);
    await expect(popup.locator("#div_mic")).toBeVisible();
    await waitForPopupReady(popup, "#div_mic");
    await expectButtonLit(popup, "#div_mic", true, "the popup should open showing the mic already muted");

    // Unmute from the page while the popup is open, then join.
    await meetingTab.locator("#mic-button").click();
    await expectButtonLit(popup, "#div_mic", false, "the popup never followed the manual unmute on the page");

    await meetingTab.evaluate(() => window.join());
    await expect(meetingTab.locator("#mic-button")).toHaveAttribute("data-is-muted", "true", { timeout: 10_000 });

    await expectButtonLit(
      popup,
      "#div_mic",
      true,
      "the popup went stale after joining — content.js wrote the re-applied state straight to " +
        "chrome.storage.sync without an updateState message, so an open popup never heard about it"
    );
  });
});
