/*global chrome*/

chrome.commands.onCommand.addListener(function (command) {
  var urls = ["https://meet.google.com/*"];

  chrome.tabs.query({ url: urls }, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      chrome.tabs.sendMessage(tab.id, { action: command });
    }
  });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("BACKGROUND Message received: ", JSON.stringify(message));
  if (message.action === "updateCamState") {
    console.log("Updating camera state to: ", message.state);
    chrome.storage.sync.set({ toggleCam: message.state }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error setting storage: ", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError });
      } else {
        sendResponse({ success: true });
      }
    });
  }
  return true; // Indicates that the response will be sent asynchronously
});
