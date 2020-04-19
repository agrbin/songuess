/*jslint indent: 2, plusplus: true*/
"use strict";

exports.HostSocket = function (socket, chatRoom, roomReadyHandler, songEndedHandler) {

  var lastFetchedTitle = null;
  var queuedRequests = [];
  var queueDoneHandler = null;

  function sendCommand(cmd) {
    socket.send(JSON.stringify({cmd: cmd}));
  }

  function moveQueue() {
    console.log('moving queue');
    if (queuedRequests.length === 0) {
      queueDoneHandler();
      queueDoneHandler = null;
      console.log('queue done');
    } else {
      const nextCmd = queuedRequests[0];
      queuedRequests = queuedRequests.slice(1);  // pop
      sendCommand(nextCmd);
    }
  }

  function queueRequests(cmdArr, done) {
    console.log('queueing requests: ', cmdArr);
    queuedRequests = cmdArr;
    queueDoneHandler = done;
    moveQueue();
  }

  function failQueue(failingCmd) {
    console.log('queue failed at cmd: ', failingCmd);
    queuedRequests = [];
    queueDoneHandler('queue failed at command: ' + failingCmd);
    queueDoneHandler = null;
  }

  this.playNext = function (done) {
    if (queuedRequests.length > 0) {
      done('play next called but there are still queued requests');
      return;
    }

    queueRequests(['pause', 'next', 'getTitle', 'play'], function() {
      if (lastFetchedTitle == null) {
        done('couldn\'t get song title');
      } else {
        done(null, {
          title: lastFetchedTitle
        });
        lastFetchedTitle = null;
      }
    });
  };

  (function () {
    socket.onmessage = function (event) {
      console.log('message ', event.data);
      var parsedMessage = JSON.parse(event.data);
      if (parsedMessage.cmd == 'roomAttached') {
        roomReadyHandler();
      } else { 
        var okStatuses = ['ok', 'already_playing', 'already_paused'];
        // these others are only called through the queue
        if (!okStatuses.includes(parsedMessage.status)) {
          failQueue(parsedMessage.cmd);
        } else {
          if (parsedMessage.cmd == 'getTitle') {
            lastFetchedTitle = parsedMessage.title;
          }
          moveQueue();
        }
      }
    };

    socket.onclose = function() {
      console.log('host socket closed itself');
      chatRoom.detachHostSocket();
    };
  }());
};
