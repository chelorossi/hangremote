/*global chrome*/
var meetLocation = "unknown";
var currentURL = location.href;

// Listen for DOM changes
var observeDOM = function () {
  var observer = new MutationObserver(function () {
    if (currentURL !== location.href) {
      currentURL = location.href;
    }
    if (detectScreen()) {
      // subtree: true because Meet's pre-join screen keeps re-rendering
      // *inside* its own container and never adds or removes another direct
      // child of <body> once it has settled. Watching only body's direct
      // children means observerInit never fires there, so the mic/cam
      // defaults silently do nothing until the user joins the call.
      buttonsWired = false;
      observerInit.observe(document.body, { childList: true, subtree: true });
      // ...and run once right now, so wiring up does not depend on any
      // further mutation arriving at all.
      syncButtons();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};
observeDOM();

// Wires the extension to the real Meet buttons: attaches the data-is-muted
// listeners, applies the mic/cam defaults and seeds the stored toggle state.
// Called both from observerInit and directly on screen detection, so it has
// to be idempotent — muteOnInit() clicks the button, and running twice would
// toggle it straight back. The guard is set synchronously, before the async
// storage read, because two mutations can otherwise both get past the checks
// while the first storage callback is still pending.
var buttonsWired = false;

var syncButtons = function () {
  if (buttonsWired) {
    return;
  }

  var buttons = document.querySelectorAll(
    elements[meetLocation].microphone.selector //eslint-disable-line no-undef
  );

  var microphone = buttons[0];
  var camera = buttons[1];

  if (!microphone || !camera) {
    return;
  }
  if (
    !microphone.hasAttribute("data-is-muted") ||
    !camera.hasAttribute("data-is-muted")
  ) {
    return;
  }

  buttonsWired = true;
  observerInit.disconnect();

  // Keeps DOM Buttons state in sync with the extension state
  chrome.storage.sync.get(["muteMicrophone", "muteCamera"], function (result) {
    attachListener(microphone, "toggleMic");
    attachListener(camera, "toggleCam");

    var isMicMuted = microphone.getAttribute("data-is-muted") === "true";
    muteOnInit(microphone, isMicMuted, result.muteMicrophone);

    var isCamMuted = camera.getAttribute("data-is-muted") === "true";
    muteOnInit(camera, isCamMuted, result.muteCamera);

    chrome.storage.sync.set({
      toggleMic: result.muteMicrophone || isMicMuted,
      toggleCam: result.muteCamera || isCamMuted,
    });
  });
};

// OBSERVER that executes on Init: the first time it loads
var observerInit = new MutationObserver(syncButtons); //observerInit

var muteOnInit = function (elem, isElemMuted, hasToBeMuted) {
  if (!isElemMuted && hasToBeMuted) {
    elem.click();
  }
};

// Binds the Google Meet buttons to the extension state
function attachListener(button, item) {
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === "data-is-muted") {
        chrome.storage.sync.get(item, function () {
          var isMuted = button.getAttribute("data-is-muted") === "true";
          try {
            if (item === "toggleCam" || item === "toggleMic") {
              chrome.runtime.sendMessage(
                {
                  action: "updateState",
                  item: item,
                  state: isMuted,
                },
                function () {
                  if (chrome.runtime.lastError) {
                    // eslint-disable-next-line no-console
                    console.error(
                      "Extension not available:",
                      chrome.runtime.lastError.message
                    );
                  }
                }
              );
            } else {
              var state = {};
              state[item] = isMuted;
              chrome.storage.sync.set(state);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Fails send updating state", error);
          }
        });
      }
    });
  });

  observer.observe(button, { attributes: true });

  button.addEventListener("click", function () {
    // The attribute change will be detected by the observer
  });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "toggleMic") {
    toggleMic(meetLocation);
  } else if (request.action == "toggleCam") {
    var result = toggleCam(meetLocation);

    sendResponse({ success: result.success, state: result.state });
  } else {
    sendResponse({ success: false });
  }
});

var toggleElement = function (meetLocation, type, key) {
  var elem = elements[meetLocation]; // eslint-disable-line no-undef

  var selector = elem[type].selector;
  var index = elem[type].index;

  var item = document.querySelectorAll(selector)[index];
  var isMuted = false;
  chrome.storage.sync.get([key], function (result) {
    isMuted = result[key];
  });

  try {
    item.click();
    chrome.storage.sync.get([key], function (result) {
      isMuted = result[key];
      chrome.runtime.sendMessage({
        action: "updateState",
        item: key,
        state: !isMuted,
      });
    });
  } catch (error) {
    return { state: error, success: false };
  }

  return {
    success: true,
    state: isMuted,
  };
};

var toggleMic = function (meetLocation) {
  return toggleElement(meetLocation, "microphone", "toggleMic");
};

var toggleCam = function (meetLocation) {
  return toggleElement(meetLocation, "camera", "toggleCam");
};

var detectScreen = function () {
  var isSplashScreen =
    document.querySelector("[data-present-landing]") !== null ||
    document.querySelector("[data-panel-id]") === null;

  var previousScreen = meetLocation;
  meetLocation = isSplashScreen ? "splashScreen" : "videocall";
  return previousScreen !== meetLocation;
};
