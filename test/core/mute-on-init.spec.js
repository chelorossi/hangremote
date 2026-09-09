import { expect, test } from "./support/extension-context.js";
import { FIXTURE_ORIGIN } from "./support/paths.js";

// Covers the "start every call with mic/cam off" defaults — the
// muteMicrophone/muteCamera checkboxes. content.js applies them exactly once,
// from muteOnInit() inside observerInit's callback, so anything that stops
// observerInit from firing silently disables the feature. Reported from prod:
// the defaults do nothing on the pre-join screen but work after joining.
test.describe("mic/cam defaults on the pre-join screen", () => {
  test("muteMicrophone/muteCamera are applied on a splash screen that only churns below <body>", async ({
    context,
    extensionId,
    serviceWorker,
  }) => {
    // What ticking both checkboxes in the popup persists.
    await serviceWorker.evaluate(() => chrome.storage.sync.set({ muteMicrophone: true, muteCamera: true }));

    const meetingTab = await context.newPage();
    await meetingTab.goto(`${FIXTURE_ORIGIN}/splashscreen-nested-churn.html`);

    await expect(
      meetingTab.locator("#mic-button"),
      "the mic was never muted on the pre-join screen — muteOnInit never ran, so the muteMicrophone default " +
        "silently does nothing until the user joins the call"
    ).toHaveAttribute("data-is-muted", "true", { timeout: 10_000 });

    await expect(
      meetingTab.locator("#cam-button"),
      "the camera was never turned off on the pre-join screen — same cause as the mic"
    ).toHaveAttribute("data-is-muted", "true", { timeout: 10_000 });
  });
});
