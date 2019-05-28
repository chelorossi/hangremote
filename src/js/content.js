/*global document chrome*/
var version = 'unknown';

var init = function () {
  setSelectorByHoVersion();
  var retries = 0;
  var handle = setInterval(function () {
    if (version !== 'unknown') {
      var elem = elements[version] // eslint-disable-line no-undef
      var microphoneSelector = elem['microphone'].selector;
      var microphoneIndex = elem['microphone'].index;
      var cameraSelector = elem['camera'].selector;
      var cameraIndex = elem['camera'].index;
      hookHangouts(microphoneSelector, microphoneIndex, cameraSelector, cameraIndex);
      syncButtonsBind();
    }
    if (retries < 6 && version === 'unknown') {
      setSelectorByHoVersion();
      retries += 1;
    } else {
      clearInterval(handle);
    }
  }, 500);
} //init


window.addEventListener("load", function load() {
  init();
}, false);


chrome.runtime.onMessage.addListener(function (request) {
  var elem = elements[version] // eslint-disable-line no-undef

  if (request.action == 'toggleMic') {
    toggleMic(elem['microphone'].selector, elem['microphone'].index);
  } else if (request.action == 'toggleCam') {
    toggleCam(elem['camera'].selector, elem['camera'].index);
  } else if (request.action == 'mute') {
    toggleCam(elem['camera'].selector, elem['camera'].index);
  }
  return true;
});

var syncButtonsBind = function () {
  var elem = elements[version] // eslint-disable-line no-undef

  chrome.storage.sync.set({ 'toggleMic': false });
  document.querySelectorAll(elem['microphone'].selector)[elem['microphone'].index].addEventListener(
    'mousedown',
    function () {
      chrome.storage.sync.get('toggleMic', function (result) {
        chrome.storage.sync.set({ 'toggleMic': !result['toggleMic'] });
      });
    }
  );

  chrome.storage.sync.set({ 'toggleCam': false });
  document.querySelectorAll(elem['camera'].selector)[elem['camera'].index].addEventListener('mousedown', function () {
    chrome.storage.sync.get('toggleCam', function (result) {
      chrome.storage.sync.set({ 'toggleCam': !result['toggleCam'] });
    });
  });
} //syncButtonsBind

var setSelectorByHoVersion = function () {
  var isHoBeta = document.querySelector('div[role="button"][jsname="gbbhzb"]') !== null;
  var isHoOriginal = document.querySelector('.ha-w-P-y-Xi-f') !== null;
  var isMeet = document.location.hostname === 'meet.google.com';

  if (isHoOriginal) {
    version = 'HoOriginal';
  } else if (isHoBeta) {
    version = 'HoBeta';
  } else if (isMeet) {
    version = 'Meet';
  } else {
    return false;
  }

  return true;
} // setSelectorByHoVersion

var hookHangouts = function (microphone, mic_index, camera, cam_index) {
  chrome.storage.sync.get('muteMicrophone', function (result) {
    if (result.muteMicrophone) {
      simulateClick(microphone, mic_index);
    }
  });

  chrome.storage.sync.get('muteCamera', function (result) {
    if (result.muteCamera) {
      simulateClick(camera, cam_index);
    }
  });
}

var toggleMic = function (selector, mic_index) {
  simulateClick(selector, mic_index);
}

var toggleCam = function (selector, cam_index) {
  simulateClick(selector, cam_index);
}

var simulateClick = function (el, index) {
  var item = document.querySelectorAll(el)[index];
  item.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  item.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  item.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
  item.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  return true;
}
