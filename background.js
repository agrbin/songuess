const WS_URL = 'ws://localhost:8080';
const CHUNK_SIZE_MS = 5000;

let webSocket = null;
let attachedInfo = null;

function initSocket() {
  webSocket = new WebSocket(WS_URL);

  webSocket.onmessage = function (event) {
    let message = JSON.parse(event.data); 
    console.log('got ws message: ', message);

    if (message.cmd == 'attachToRoom') {
      if (message.status == 'ok') {
        startStreaming();
      } else {
        chrome.runtime.sendMessage({
          cmd: 'errorAttaching',
          message: message.message
        });
      }
    } else if (message.cmd == 'play') {
      sendToAttachedTab({cmd: 'play'}, function (response) {
        if (response.status != 'ok') {
          sendToWebSocket({cmd: 'play', status: response.status});
        }
      });
    } else if (message.cmd == 'pause') {
      sendToAttachedTab({cmd: 'pause'}, function (response) {
        if (response.status != 'ok') {
          sendToWebSocket({cmd: 'pause', status: response.status});
        }
      });
    } else if (message.cmd == 'next') {
      sendToAttachedTab({cmd: 'next'}, function (response) {
        if (response.status != 'ok') {
          sendToWebSocket({cmd: 'next', status: response.status});
        }
      });
    } else if (message.cmd == 'getTitle') {
      sendToAttachedTab({cmd: 'getTitle'}, function (response) {
        console.log('got getTitle response: ', response);
        if (response.status != 'ok') {
          sendToWebSocket({cmd: 'getTitle', status: response.status});
        } else {
          sendToWebSocket({cmd: 'getTitle', title: response.title, status: 'ok'});
        }
      });
    }
  };

  webSocket.onerror = function (event) {
    console.log('ws error connecting: ', event);
    chrome.runtime.sendMessage({
      cmd: 'errorAttaching',
      message: 'Can\'t connect to web socket'
    });
  };

  webSocket.onclose = function (event) {
    console.log('socket closed by the server');
    webSocket = null;
  }
}

function sendToAttachedTab(o, handleResponse) {
  if (attachedInfo === null) {
    console.log('tab not attached, failed to send: ', o);
  } else {
    chrome.tabs.sendMessage(attachedInfo.tabId, o, handleResponse);
  }
}

function sendToWebSocket(o) {
  console.log('sending to ws: ', o);
  webSocket.send(JSON.stringify(o));
}

function startStreaming() {
//  chrome.tabCapture.capture({
//    audio: true,
//    video: false
//  }, function(stream) {
//    console.log("got stream: ", stream);
//

    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      attachedInfo = {
        tabId: tabs[0].id,
        // stream = 
        // recorder =
      };
      chrome.runtime.sendMessage({cmd: 'startedStreaming'});
      sendToWebSocket({cmd: 'roomAttached'});
    });

//    audioStream = stream;
//    mediaRecorder = new MediaRecorder(stream);
//    mediaRecorder.start(CHUNK_SIZE_MS);    
//    mediaRecorder.ondataavailable = function (e) {
//      console.log('ondataavailable: ', e.data);
//      e.data.arrayBuffer().then(buffer => webSocket.send(buffer));
//    };
//  });
}

function stopStreaming() {
  if (attachedInfo !== null) {
    if (attachedInfo.recorder && attachedInfo.recorder.state != 'inactive') {
      attachedInfo.recorder.stop();
    }
    if (attachedInfo.stream) {
      attachedInfo.stream.getTracks().forEach(track => track.stop());
    }
    attachedInfo = null;
  }
}

function attachToRoom(roomName) {
  sendToWebSocket({
    cmd: 'attachToRoom',
    roomName: roomName
  });
}

// Message handling.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('got message: ', request);

  if (request.cmd == 'attachToRoom') {
    if (webSocket === null) {
      initSocket();
      webSocket.onopen = function() {
        attachToRoom(request.roomName);
      };
    } else {
      attachToRoom(request.roomName);
    }
  } else if (request.cmd == 'detach') {
    if (attachedInfo === null) {
      console.log('unexpected state, got detach while not streaming');
    } else {
      stopStreaming();
      webSocket.close();
      webSocket = null;
    }
  } else if (request.cmd == 'isAttached') {
    sendResponse(attachedInfo !== null);
  } else if (request.cmd == 'clickDone') {
    sendToWebSocket({cmd: request.triggeringAction, status: 'ok'});    
  }
});

// Enable songuess icon (page action) for pages matching these URLs.
chrome.runtime.onInstalled.addListener(function() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { urlPrefix: 'https://play.google.com/music' }
        })
      ],
      actions: [ new chrome.declarativeContent.ShowPageAction() ]
    }]);
  });
});
