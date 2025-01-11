/*global document chrome*/
var meetLocation = "unknown";
var currentURL = location.href;

// Listen for DOM changes
var observeDOM = function () {
  var observer = new MutationObserver(function () {
    if (currentURL !== location.href) {
      currentURL = location.href;
      console.log("URL changed to: ", currentURL);
      // handlePageChange();
    }
    if (detectScreen()) {
      console.log("meetLocation", meetLocation);
      observerInit.observe(document.body, { childList: true });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};
observeDOM();

// OBSERVER that executes on Init: the first time it loads
var observerInit = new MutationObserver(function () {
  console.log("observerInit() content.js - OBSERVER INIT !!!");

  var buttons = document.querySelectorAll(
    elements[meetLocation].microphone.selector
  ); //eslint-disable-line no-undef

  var microphone = buttons[0];
  var camera = buttons[1];

  // Keeps DOM Buttons state in sync with the extension state
  if (microphone && camera) {
    if (microphone && microphone.getAttribute("data-is-muted") == "false") {
      chrome.storage.sync.get("muteMicrophone", function (result) {
        chrome.storage.sync.set({ toggleMic: result.muteMicrophone });

        if (result.muteMicrophone) {
          muteOnInit(microphone, "muteMicrophone");
          // observerInit.disconnect();
        } // else do nothing
      });
    }

    chrome.storage.sync.get("muteCamera", function (result) {
      if (camera.getAttribute("data-is-muted") === "false") {
        if (result.muteCamera) {
          console.log("Muting Camera on Init");
          muteOnInit(camera, "muteCamera");
        }
        chrome.storage.sync.set({ toggleCam: result.muteCamera }, function () {
          console.log("toggleCam", result.muteCamera);
        });
      }
      attachListener(camera, "toggleCam");
      observerInit.disconnect();
    });
  }
}); //observerInit

var targetNode = document.body;
observerInit.observe(targetNode, { childList: true });

var muteOnInit = function (elem) {
  elem.click();
};

function attachListener(button, item) {
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === "data-is-muted") {
        chrome.storage.sync.get(item, function () {
          var isMuted = button.getAttribute("data-is-muted") === "true";
          console.log(
            "LISTENER CLICK IN item: " + item + " data-is-muted:" + isMuted
          );

          try {
            if (item === "toggleCam") {
              chrome.runtime.sendMessage(
                {
                  action: "updateCamState",
                  state: isMuted,
                },
                function () {
                  if (chrome.runtime.lastError) {
                    console.log(
                      "Extension not available:",
                      chrome.runtime.lastError.message
                    );
                  }
                }
              );
            } else {
              console.log("Setting item: " + item + " to " + isMuted);
              chrome.storage.sync.set({ item: isMuted });
            }
          } catch (error) {
            console.log("Failed to send message:", error);
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
    console.log("Unknown action: ", request.action);
    sendResponse({ success: false });
  }
  return true;
});

var toggleMic = function (meetLocation) {
  var elem = elements[meetLocation]; // eslint-disable-line no-undef
  console.log("meetLocation", meetLocation);

  var selector = elem["microphone"].selector;
  var mic_index = elem["microphone"].index;

  simulateClick(selector, mic_index);
};

var toggleCam = function (meetLocation) {
  var elem = elements[meetLocation]; // eslint-disable-line no-undef
  console.log("meetLocation", meetLocation);

  var selector = elem["camera"].selector;
  var cam_index = elem["camera"].index;
  var item = document.querySelectorAll(selector)[cam_index];
  try {
    item.click();
    chrome.storage.sync.set({
      toggleCam: item.getAttribute("data-is-muted") === "true",
    });
  } catch (error) {
    console.log("toggleCam() content.js - error: ", error);
    return { state: error, success: false };
  }
  var isMuted = item.getAttribute("data-is-muted") === "true";
  // chrome.storage.sync.set({ toggleCam: isMuted }, function () {
  //   console.log("SET toggleCam() - Storage updated: ", isMuted);
  // });

  console.log("toggleCam() content.js - click() !!! is-muted???: ", isMuted);
  return {
    success: true,
    state: isMuted,
  };
};

var simulateClick = function (el, index) {
  console.log("simulateClick() content.js - INIT !!! ", el, index);
  var item = document.querySelectorAll(el)[index];
  item.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  item.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  item.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
  item.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  item.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
  item.dispatchEvent(new MouseEvent("click", { bubbles: true }));

  return true;
};

var detectScreen = function () {
  var isSplashScreen = document.querySelectorAll("div > button").length > 0;
  var previousScreen = meetLocation;
  meetLocation = isSplashScreen ? "splashScreen" : "videocall";
  return previousScreen !== meetLocation;
};

window.addEventListener(
  "DOMContentLoaded",
  function load() {
    init();
  },
  false
);

var init = function () {
  console.log("init() content.js - INIT !!! ---  DOMContentLoaded");
  // var isSplashScreen = document.querySelectorAll("div > button").length > 0;
  // meetLocation = isSplashScreen ? "splashScreen" : "videocall";
  // console.log("meetLocation", meetLocation);
  // var elem = elements[meetLocation]; // eslint-disable-line no-undef
  // var microphoneSelector = elem["microphone"].selector;
  // var microphoneIndex = elem["microphone"].index;
  // var cameraSelector = elem["camera"].selector;
  // var cameraIndex = elem["camera"].index;
  // hookMeet(microphoneSelector, microphoneIndex, cameraSelector, cameraIndex);
}; //init
