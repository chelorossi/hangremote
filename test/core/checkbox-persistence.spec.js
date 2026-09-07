import { expect, test } from "./support/extension-context.js";

// Covers src/js/extension.js: initExtension()/saveSettings() — the
// "no microphone/camera at start" checkboxes persist via
// chrome.storage.sync and are restored the next time the popup opens.
// Deliberately uses no meeting-tab fixture: init()'s no-tab branch still
// wires up the checkbox listeners (they sit outside the `if (clicks)`
// guard in extension.js), so this exercises that path in isolation.
test.describe("popup checkbox persistence (no meeting tab)", () => {
  test("muteMicrophone/muteCamera checkboxes persist across popup reopen", async ({ context, extensionId }) => {
    const popup1 = await context.newPage();
    await popup1.goto(`chrome-extension://${extensionId}/src/popup.html`);

    await expect(popup1.locator("#muteMicrophone")).not.toBeChecked();
    await expect(popup1.locator("#muteCamera")).not.toBeChecked();

    await popup1.locator("#muteMicrophone").check();
    await popup1.close();

    const popup2 = await context.newPage();
    await popup2.goto(`chrome-extension://${extensionId}/src/popup.html`);

    await expect(
      popup2.locator("#muteMicrophone"),
      "muteMicrophone checkbox did not persist via chrome.storage.sync across popup reopen"
    ).toBeChecked();
    await expect(popup2.locator("#muteCamera")).not.toBeChecked();
  });
});
