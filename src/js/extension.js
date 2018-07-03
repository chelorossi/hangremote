/*global document chrome console*/

var systemState = {'toggleMic': false, toggleCam: false}; //buttons state
var tabUrls = null;

chrome.runtime.onInstalled.addListener(function() {
  sendToggle({action: 'init'});
});


var f_install_clicks = function (button, $tagDiv, $tagSpan) {
//  console.log('installing clicks');
  updateButton(button, $tagDiv, $tagSpan);
  document.getElementById($tagDiv).addEventListener('click', function() {
    systemState[button] = !systemState[button];
    sendToggle(button);
    updateButton(button, $tagDiv, $tagSpan);
  });
}

function updateButton(button, $tagDiv, $tagSpan) {
  if (!systemState[button]) {
    document.getElementById($tagSpan).style.color= 'rgba(69, 90, 100, 1)';
    document.getElementById($tagDiv).style.backgroundColor= 'rgba(69, 90, 100, 0)';
  } else {
    document.getElementById($tagSpan).style.color= 'white';
    document.getElementById($tagDiv).style.backgroundColor= 'rgb(255, 82, 82)'; //red
  }
}

function sendToggle(button) {
  chrome.tabs.query({url: tabUrls}, function(results) {
    if (results.length == 0) {
      chrome.tabs.create({url: 'http://g.co/hangouts'}, function() {
          //chrome.tabs.executeScript(tab.id,{file: "buy.js"});
      });
    } else if (button === 'togglePhone') {
        chrome.tabs.remove(results[0].id, function() {
          return;
        });
    } else {
      chrome.tabs.sendMessage(results[0].id,  {action: button});
    }
  });
}

/**
 * loadSettings() grabs state for buutons/actions
 * updating systemState based on local storage variables
 */
function loadSettings(clicks) {
//  console.log("window extension.js loaded");

  chrome.storage.sync.get('muteMicrophone', function (result) {
      document.getElementById('muteMicrophone').checked = result.muteMicrophone;
      //systemState['toggleMic'] = result.muteMicrophone;
  });

  chrome.storage.sync.get('muteCamera', function (result) {
      document.getElementById('muteCamera').checked = result.muteCamera;
  });

  chrome.storage.sync.get('toggleMic', function (storageState) {
      systemState['toggleMic'] = storageState.toggleMic;
      if (clicks) {
        f_install_clicks('toggleMic', 'div_mic', 'span_mic');
      }
  });

  chrome.storage.sync.get('toggleCam', function (storageState) {
      systemState['toggleCam'] = storageState.toggleCam;
      if (clicks) {
        f_install_clicks('toggleCam', 'div_cam', 'span_cam');
      }
  });

  if (clicks) {
    document.getElementById('div_phone').addEventListener('click', function() {
      sendToggle('togglePhone');
//      console.log("sending:" + button);
    });
  }

  document.getElementById('muteCamera').addEventListener('click', saveSettings);
  document.getElementById('muteMicrophone').addEventListener('click', saveSettings);
}

function saveSettings() {
    var muteMicrophone = document.getElementById('muteMicrophone').checked;
    var muteCamera = document.getElementById('muteCamera').checked;

    chrome.storage.sync.set({'muteMicrophone': muteMicrophone});
    chrome.storage.sync.set({'muteCamera': muteCamera});
}

/***** MAIN EVENT FOR INIT (LOAD EXTENSION) ***************/
window.addEventListener('load', init);


function init() {
  var manifestData = chrome.runtime.getManifest();
  tabUrls = manifestData.content_scripts[0].matches;

  chrome.tabs.query({url: tabUrls}, function(results) {
    if (results.length == 0) {
      document.getElementsByClassName("icons")[0].style.display = 'none';
      loadSettings(false);
    } else {
      loadSettings(true)
    }
  });
}
