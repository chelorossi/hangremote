import fs from "node:fs";
import path from "node:path";

import { BUILD_DIR, FIXTURE_ORIGIN, TEST_BUILD_DIR, UNINJECTED_FIXTURE } from "./support/paths.js";

// The real manifest only injects content.js into *://meet.google.com/*.
// Rather than testing against live Meet (non-deterministic DOM, requires
// login) we widen a *copy* of the built extension to also match our local
// fixture server, exactly as MEETREMOTE_RECORDING_SPEC.md recommends for
// the recording harness ("temporarily widen the content-script match
// pattern in a test build"). ./build and manifest.json on disk are never
// touched.
export default async function globalSetup() {
  if (!fs.existsSync(path.join(BUILD_DIR, "manifest.json"))) {
    throw new Error(`No built extension at ${BUILD_DIR} — run "npm run build" before "npm run test:core".`);
  }

  fs.rmSync(TEST_BUILD_DIR, { recursive: true, force: true });
  fs.cpSync(BUILD_DIR, TEST_BUILD_DIR, { recursive: true });

  const manifestPath = path.join(TEST_BUILD_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const fixtureMatch = `${FIXTURE_ORIGIN}/*`;
  const matches = manifest.content_scripts[0].matches;
  if (!matches.includes(fixtureMatch)) {
    matches.push(fixtureMatch);
  }

  // One fixture is deliberately left without a content script. extension.js
  // reads tabUrls straight off content_scripts[0].matches, so this page is
  // still found by its chrome.tabs.query — but nothing is listening in it,
  // which is what makes chrome.tabs.sendMessage set runtime.lastError. That
  // is the state a Meet tab is really in when the extension was reloaded or
  // updated after the tab was opened, and it is the only way to reach
  // sendToggle's failure path from a test (chrome.tabs.discard reproduces it
  // too, but tears down every CDP target in the context).
  manifest.content_scripts[0].exclude_matches = [`${FIXTURE_ORIGIN}/${UNINJECTED_FIXTURE}`];

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
