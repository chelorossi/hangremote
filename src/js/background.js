/*global chrome*/

chrome.commands.onCommand.addListener(function (command) {
  var urls = ["https://meet.google.com/*"];

  chrome.tabs.query({ url: urls }, function (tabs) {
    if (command === "leaveMeeting") {
      chrome.tabs.remove(tabs[0].id, function () {
        return;
      });
    }
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      chrome.tabs.sendMessage(tab.id, { action: command, tabId: tab.id });
    }
  });
});

chrome.runtime.onMessage.addListener(function (message) {
  if (message.action === "updateState") {
    var item = message.item;
    var obj = {};
    obj[item] = message.state;
    chrome.storage.sync.set(obj);
  }
  return true; // Indicates that the response will be sent asynchronously
});
