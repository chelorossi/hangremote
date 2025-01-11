/*global document chrome console*/

var systemState = { toggleMic: false, toggleCam: false }; //buttons state
var tabUrls = null;

chrome.runtime.onInstalled.addListener(function () {
  sendToggle({ action: "init" });
});

chrome.runtime.onStartup.addListener(function () {
  initExtension(true);
});

function updateButton(button, $tagDiv, $tagSpan) {
  if (!systemState[button]) {
    document.getElementById($tagSpan).style.color = "rgba(69, 90, 100, 1)";
    document.getElementById($tagDiv).style.backgroundColor =
      "rgba(69, 90, 100, 0)";
  } else {
    document.getElementById($tagSpan).style.color = "white";
    document.getElementById($tagDiv).style.backgroundColor = "rgb(255, 82, 82)"; //red
  }
}

function sendToggle(button, $tagDiv, $tagSpan) {
  chrome.tabs.query({ url: tabUrls }, function (tabs) {
    if (tabs.length == 0) {
      chrome.tabs.create({ url: "https://meet.google.com" }, function () {
        /* Do nothing on callback */
      });
    } else if (button === "togglePhone") {
      chrome.tabs.remove(tabs[0].id, function () {
        return;
      });
    } else {
      toggleButton(tabs[0].id, button, $tagDiv, $tagSpan);
    }
  });
}

function toggleButton(tab, button) {
  console.log("sendToggle() - extension.js !!!", button, systemState[button]);

  chrome.tabs.sendMessage(tab, { action: button }, function (response) {
    if (response && response.success) {
      console.log("Camera toggled state:, ", response.state);

      // chrome.storage.sync.set({ button: response.state });
      // systemState[button] = response.state;
      // updateButton(button, $tagDiv, $tagSpan);
    } else {
      console.log("Failed to toggle: ", JSON.stringify(response));
    }
  });
}

// Add a listener to handle messages from content.js
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Message received: ", JSON.stringify(message));
  if (message.action === "updateCamState") {
    systemState["toggleCam"] = message.state;

    chrome.storage.sync.set({ toggleCam: message.state });

    // updateButton(button, $tagDiv, $tagSpan);
    console.log("updateCamState() - extension.js !!!", message.state);
    updateButton("toggleCam", "div_cam", "span_cam");
  }
  sendResponse({ success: true });
});

/**
 * loadSettings() grabs state for buttons/actions //FIX: based in actual buttons state
 * updating systemState based on local storage variables
 */
function initExtension(clicks) {
  // load mic checkbox state
  chrome.storage.sync.get("muteMicrophone", function (result) {
    document.getElementById("muteMicrophone").checked = result.muteMicrophone;
  });
  // load camera checkbox state
  chrome.storage.sync.get("muteCamera", function (result) {
    document.getElementById("muteCamera").checked = result.muteCamera;
  });

  chrome.storage.sync.get("toggleMic", function (storageState) {
    systemState["toggleMic"] = storageState.toggleMic;
    if (clicks) {
      f_install_clicks("toggleMic", "div_mic", "span_mic");
    }
  });

  chrome.storage.sync.get("toggleCam", function (storageState) {
    systemState["toggleCam"] = storageState.toggleCam;
    if (clicks) {
      f_install_clicks("toggleCam", "div_cam", "span_cam");
    }
  });

  if (clicks) {
    document.getElementById("div_phone").addEventListener("click", function () {
      sendToggle("togglePhone");
    });
  }

  document.getElementById("muteCamera").addEventListener("click", saveSettings);
  document
    .getElementById("muteMicrophone")
    .addEventListener("click", saveSettings);
}

var f_install_clicks = function (button, $tagDiv, $tagSpan) {
  updateButton(button, $tagDiv, $tagSpan);
  console.log(
    "f_install_clicks() - INIT !!! button $1 : $2",
    button,
    systemState[button]
  );

  document.getElementById($tagDiv).addEventListener("click", function () {
    // optimistically update the button state
    systemState[button] = !systemState[button]; //TODO: Check me out!
    updateButton(button, $tagDiv, $tagSpan);

    chrome.storage.sync.get("toggleCam", function (result) {
      console.log("toggleCam!!", result.toggleCam);
    });
    sendToggle(button, $tagDiv, $tagSpan);
  });
};

/***** MAIN EVENT FOR INIT (LOAD EXTENSION) ***************/
window.addEventListener("load", init);

function init() {
  var manifestData = chrome.runtime.getManifest();
  tabUrls = manifestData.content_scripts[0].matches;

  chrome.tabs.query({ url: tabUrls }, function (tabs) {
    if (tabs.length == 0) {
      document.getElementsByClassName("icons")[0].style.display = "none";
      initExtension(false);
    } else {
      // load settings and install clicks
      initExtension(true);
    }
  });
}

function saveSettings() {
  var muteMicrophone = document.getElementById("muteMicrophone").checked;
  var muteCamera = document.getElementById("muteCamera").checked;

  chrome.storage.sync.set({ muteMicrophone: muteMicrophone });
  chrome.storage.sync.set({ muteCamera: muteCamera });
}
