const Selectors = {
  startPlaylistButton: '#playButton',
  playPauseButton: '#player-bar-play-pause',
  nextButton: '#player-bar-forward',
  currentTitle: '#currently-playing-title'
};

// Click actions always wait this amount after executing.
const AFTER_CLICK_DELAY_MS = 1000;

console.log('hi from content script: ', document.URL);

// The current title is there iff the play bar is ready.
// When the bar is ready, one can use the playPauseButton.
// Otherwise, we have to click startPlaylistButton to start playing.
function playBarReady() {
  console.log('play bar ready:', (document.querySelector(Selectors.currentTitle) !== null));
  return document.querySelector(Selectors.currentTitle) !== null;
}

function currentlyPlaying() {
  const el = document.querySelector(Selectors.playPauseButton);
  console.log('currently playing:', (el.title == 'Pause'));
  return el.title == 'Pause';
}

function getCurrentTitle() {
  const el = document.querySelector(Selectors.currentTitle);
  return el? el.textContent: null;
}

function clickSelector(selector, messageType) {
  console.log('trying to click selector: ', selector);
  const el = document.querySelector(selector);
  if (el) {
    el.click();
    return true;
  } else {
    sendError(messageType, messages.status.selectorNotFound);
    return false;
  }
}

function sendTitle(messageType) {
  const title = getCurrentTitle();
  if (title !== null) {
    chrome.runtime.sendMessage(messages.newMessage(messageType, {
      title: title
    }));
  } else {
    sendError(messageType, messages.status.titleNotFound);
  }
}

function sendError(messageType, error) {
  chrome.runtime.sendMessage(messages.newError(messageType, error));
}

chrome.runtime.onMessage.addListener(function(message) {
  console.log('got message: ', message);

  const messageType = messages.getType(message);

  if (messageType == messages.type.moveToNextSong) {
    if (playBarReady()) {
      const clickNextAndSendTitle = function() {
        clickSelector(Selectors.nextButton, messageType);
        setTimeout(function() {
          sendTitle(messageType);
        }, AFTER_CLICK_DELAY_MS);
      };

      if (currentlyPlaying()) {
        clickSelector(Selectors.playPauseButton, messageType);
        setTimeout(clickNextAndSendTitle, AFTER_CLICK_DELAY_MS);
      } else {
        clickNextAndSendTitle();
      }
    } else {
      clickSelector(Selectors.startPlaylistButton, messageType);
      setTimeout(function() {
        clickSelector(Selectors.playPauseButton, messageType);
        setTimeout(function() {
          clickSelector(Selectors.nextButton, messageType);
          setTimeout(function() {
            sendTitle(messageType);
          }, AFTER_CLICK_DELAY_MS);
        }, AFTER_CLICK_DELAY_MS);
      }, AFTER_CLICK_DELAY_MS);
    }
  } else if (messageType == messages.type.startPlaying) {
    // This assumes moveToNextSong was called beforehand.
    // It makes sense, because you can't know the title that's about to play
    // unless you previously called moveToNextSong.
    if (clickSelector(Selectors.playPauseButton, messageType)) {
      setTimeout(function() {
        chrome.runtime.sendMessage(messages.newMessage(messageType));
      }, AFTER_CLICK_DELAY_MS);
    }
  }
});
