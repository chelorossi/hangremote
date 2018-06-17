/*global document chrome*/
var version = 'unknown';

var init = function() {
  setSelectorByHoVersion();
  var retries = 0;
  var handle = setInterval(function () {
    if (version !== 'unknown') {
      var microphoneSelector = elements[version]['microphone'].selector;
      var cameraSelector = elements[version]['camera'].selector;
      hookHangouts(microphoneSelector, cameraSelector);
      syncButtonsBind();
    }
    if (retries < 6 && version === 'unknown') {
      setSelectorByHoVersion();
      retries+=1;
    } else {
      clearInterval(handle);
    }
  }, 500);
} //init


window.addEventListener("load", function load() {
  init();
},false);


chrome.runtime.onMessage.addListener( function(request) {
  if (request.action == 'toggleMic') {
    toggleMic(elements[version]['microphone'].selector);
  } else if (request.action == 'toggleCam') {
    toggleCam(elements[version]['camera'].selector);
  } else if (request.action == 'mute') {
    toggleCam(elements[version]['camera'].selector);
  }
  return true;
});

var syncButtonsBind = function () {

  chrome.storage.sync.set({'toggleMic': false});
  document.querySelector(elements[version]['microphone'].selector).addEventListener('mousedown', function() {
    chrome.storage.sync.get('toggleMic', function (result) {
      chrome.storage.sync.set({'toggleMic': !result['toggleMic']});
    });
  });

  chrome.storage.sync.set({'toggleCam': false});
  document.querySelector(elements[version]['camera'].selector).addEventListener('mousedown', function() {
    chrome.storage.sync.get('toggleCam', function (result) {
      chrome.storage.sync.set({'toggleCam': !result['toggleCam']});
    });
  });
} //syncButtonsBind

var setSelectorByHoVersion = function () {
  var isHoBeta = document.querySelector('div[role="button"][jsname="gbbhzb"]') !== null;
  var isHoOriginal = document.querySelector('.ha-w-P-y-Xi-f') !== null;

  if (isHoOriginal) {
      version = 'HoOriginal';
  } else if (isHoBeta) {
      version = 'HoBeta';
  } else {
      return false;
  }

  return true;
} // setSelectorByHoVersion

var elements =
  {
    HoOriginal: {
      microphone:
      {
        'selector': '.IQ',
        'flag': '.IQ[aria-pressed="true"]' //flag = 'a-b-B';
      },
      camera:
      {
        'selector': '.OQ',
        'flag': '.OQ[aria-pressed="true"]'
      }
    },
    HoBeta: {
      microphone:
      {
        'selector': 'div[role="button"][jsname="gbbhzb"]',
        'flag': '.IQ[aria-pressed="true"]' //flag = 'U8OAre';
      },
      camera:
      {
        'selector': 'div[role="button"][jsname="YczAdf"]',
        'flag': '.YczAdf'
      }
    }
  }


var hookHangouts = function(microphone, camera) {
   chrome.storage.sync.get('muteMicrophone', function (result) {
       if (result.muteMicrophone) {
           simulateClick(microphone);
       }
   });

   chrome.storage.sync.get('muteCamera', function (result) {
       if (result.muteCamera) {
           simulateClick(camera);
       }
   });
}

var toggleMic = function(selector) {
    simulateClick(selector);
}

var toggleCam = function(selector) {
    simulateClick(selector);
}

var simulateClick = function(el) {
  var item = document.querySelector(el);
  item.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}));
  item.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
  item.dispatchEvent(new PointerEvent('pointerup', {bubbles: true}));
  item.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
  item.dispatchEvent(new MouseEvent('mouseout', {bubbles: true}));
  item.dispatchEvent(new MouseEvent('click', {bubbles: true}));

  return true;
}
