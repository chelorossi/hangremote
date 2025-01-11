/// elements to trigger events on
/// elements with index is for grabbin the i th element from querySelectorAll

// eslint-disable-next-line no-unused-vars
var elements = {
  splashScreen: {
    microphone: {
      selector: 'div[role="button"]',
      index: 0,
    },
    camera: {
      selector: 'div[role="button"]',
      index: 1,
    },
  },
  videocall: {
    microphone: {
      selector: "span > button:first-child[data-is-muted]",
      index: 0,
    },
    camera: {
      selector: "span > button:first-child[data-is-muted]",
      index: 1,
    },
  },
};
