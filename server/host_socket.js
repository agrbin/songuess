/*jslint indent: 2, plusplus: true*/
"use strict";

// The socket connected to a Chrome extension.
// Each chat room would have its own instance.
exports.HostSocket = function (socket, chatRoom, roomReadyHandler, songEndedHandler) {

  var doneHandler = null;
  var fetchedTitle = null;

  function sendCommand(type) {
    console.log('sending command:', type);
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

  this.closeSocket = function() {
    socket.close();
  };

  (function () {
    socket.onmessage = function (event) {
      // Got audio data.
      if (event.data instanceof Buffer) {
        console.log('got audio with size:', event.data.length);
        chatRoom.broadcastRaw(event.data);
      } else {
        console.log('message ', event.data);

        var message = JSON.parse(event.data);
        var messageType = message.type;

        if (messageType == 'startedStreaming') {
          roomReadyHandler();
        } else if (messageType == 'moveToNextSong') {
          if (message.status == 'OK' && message.data.title) {
            fetchedTitle = message.data.title;

            // recorder.stop() has been called on the client at this point
            // now's the time to clear the host chunks in the client app
            chatRoom.broadcast('clear_host_chunks');

            // this should not be called before clients cleared the chunks
            // TODO this is not currently guaranteed, the extension could get
            // the message before the songuess clients
            sendCommand('startPlaying');
          } else {
            if (doneHandler !== null) {
              doneHandler();
            }
          }
        } else if (messageType == 'startPlaying') {
          if (doneHandler !== null) {
            if (message.status == 'OK') {
              doneHandler(fetchedTitle);
            } else {
              doneHandler(null);
            }
          }
        } else if (messageType == 'songHasEnded') {
          songEndedHandler(); 
        }
      }
    };

    socket.onclose = function() {
      console.log('host socket closed itself');
      chatRoom.detachHostSocket();
    };
  }());
};
