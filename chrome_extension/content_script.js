const Selectors = {
  playPauseButton: '#player-bar-play-pause',
  nextButton: '#player-bar-forward',
  currentTitle: '#currently-playing-title'
};

// Successful click actions will send the response after this time.
const CLICK_CONFIRMATION_DELAY_MS = 2000;

console.log('hi from content script: ', document.URL);

function currentlyPlaying() {
  const el = document.querySelector(Selectors.playPauseButton);
  console.log('currentlyPlaying, title is: ', el.title);
  console.log('returning value:', (el.title == 'Pause'));
  return el.title == 'Pause';
}

function clickSelector(selector, triggeringAction) {
  console.log('trying to click selector: ', selector);
  const el = document.querySelector(selector);
  if (el) {
    el.click();
    setTimeout(function () {
      chrome.runtime.sendMessage({
        cmd: 'clickDone',
        triggeringAction: triggeringAction
      });
    }, CLICK_CONFIRMATION_DELAY_MS);
    return {status: 'ok'};
  } else {
    return {status: 'selector_not_found'};
  }
}

function getElementValue(selector) {
  const el = document.querySelector(selector);
  return el? el.textContent: null;
}

chrome.runtime.onMessage.addListener(function(request, sender, response) {
  console.log('got message: ' + request.cmd);

  if (request.cmd == 'play') {
    if (currentlyPlaying()) {
      response({status: 'already_playing'});
    } else {
      response(clickSelector(Selectors.playPauseButton, request.cmd));
    }
  } else if (request.cmd == 'pause') {
    if (!currentlyPlaying()) {
      response({status: 'already_paused'});
    } else {
      response(clickSelector(Selectors.playPauseButton, request.cmd));
    }
  } else if (request.cmd == 'next') {
    response(clickSelector(Selectors.nextButton, request.cmd));
  } else if (request.cmd == 'getTitle') {
    const val = getElementValue(Selectors.currentTitle);
    if (val) {
      console.log('title: ', val);
      response({status: 'ok', title: val});
    } else {
      console.log('couldn\'t get title');
      response({status: 'title not found'});
    }
  }
});
