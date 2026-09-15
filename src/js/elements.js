/// elements to trigger events on
/// elements with index is for grabbin the i th element from querySelectorAll

// Both Meet screens expose the mic and camera as the only two elements
// carrying data-is-muted, mic first. Keying off that attribute alone is what
// makes this survive Meet's re-skins: the pre-join screen moved from
// div[role="button"] (Jan 2025) to <button> wrapped in a <span> (Sep 2026),
// and grew unrelated div[role="button"] controls — "Backgrounds and effects",
// Gemini notes — that now occupy the first two positions. The old positional
// selector kept matching those, so the extension was driving the effects
// button instead of the microphone and the mic/cam defaults did nothing.
// Verified against the four captured page dumps: pre-join and in-call, 2025
// and 2026.
// eslint-disable-next-line no-unused-vars
var elements = {
  splashScreen: {
    microphone: {
      selector: "[data-is-muted]",
      index: 0,
    },
    camera: {
      selector: "[data-is-muted]",
      index: 1,
    },
  },
  videocall: {
    microphone: {
      selector: "[data-is-muted]",
      index: 0,
    },
    camera: {
      selector: "[data-is-muted]",
      index: 1,
    },
  },
};
