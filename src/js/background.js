/*global chrome*/

chrome.commands.onCommand.addListener(function (command) {
  var urls = ["https://meet.google.com/*"];

  chrome.tabs.query({ url: urls }, function (tabs) {
    if (tabs.length == 0) {
      return;
    }
    if (command === "leaveMeeting") {
      chrome.tabs.remove(tabs[0].id, function () {
        return;
      });
      return;
    }
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      chrome.tabs.sendMessage(tab.id, { action: command, tabId: tab.id });
    }
  });
});

var ALLOWED_STATE_ITEMS = ["toggleMic", "toggleCam"];

chrome.runtime.onMessage.addListener(function (message, sender) {
  if (message.action === "updateState") {
    var isTrustedSender =
      sender.id === chrome.runtime.id &&
      sender.tab &&
      /^https:\/\/meet\.google\.com\//.test(sender.tab.url || "");
    var item = message.item;
    if (
      isTrustedSender &&
      ALLOWED_STATE_ITEMS.indexOf(item) !== -1 &&
      typeof message.state === "boolean"
    ) {
      var obj = {};
      obj[item] = message.state;
      chrome.storage.sync.set(obj);
    }
  }
  return true; // Indicates that the response will be sent asynchronously
});
