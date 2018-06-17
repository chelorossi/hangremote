/*global document chrome*/

chrome.commands.onCommand.addListener(function(command) {

    var urls = [
        'https://hangouts.google.com/*'
    ];

    chrome.tabs.query({ url: urls }, function(tabs) {
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            chrome.tabs.sendMessage(tab.id, {action: command});
        }
    });
});
