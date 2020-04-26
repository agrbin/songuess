/*jslint indent: 2, plusplus: true*/
"use strict";

exports.HostSocket = function (socket, chatRoom, roomReadyHandler, songEndedHandler) {

  var doneHandler = null;
  var fetchedTitle = null;

  function sendCommand(type) {
    socket.send(JSON.stringify({type: type}));
  }

  this.playNext = function (done) {
    if (doneHandler !== null) {
      done('still executing previous playNext');
      return;
    }

    doneHandler = function(title) {
      if (title) {
        done(null, {title: title});
      } else {
        done('couldn\'t get the title');
      }

      doneHandler = null;
    };

    sendCommand('moveToNextSong');    
  };

  (function () {
    socket.onmessage = function (event) {
      console.log('message ', event.data);

      var message = JSON.parse(event.data);
      var messageType = message.type;

      if (messageType == 'startedStreaming') {
        roomReadyHandler();
      } else if (messageType == 'moveToNextSong') {
        if (message.status == 'OK' && message.data.title) {
          fetchedTitle = message.data.title;
          sendCommand('startPlaying');
        } else {
          doneHandler();
        }
      } else if (messageType == 'startPlaying') {
        if (message.status == 'OK') {
          doneHandler(fetchedTitle);
        } else {
          doneHandler(null);
        }
      }
    };

    socket.onclose = function() {
      console.log('host socket closed itself');
      chatRoom.detachHostSocket();
    };
  }());
};
