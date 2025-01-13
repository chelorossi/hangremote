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

chrome.runtime.onMessage.addListener(function (message) {
  console.log("background.js Message received: ", JSON.stringify(message));

  if (message.action === "updateState") {
    /* eslint-disable-next-line */
    var item = message.item;
    /* eslint-disable-next-line */
    chrome.storage.sync.set({ item: message.state });
  }
  return true; // Indicates that the response will be sent asynchronously
});
