/*jslint indent: 2, plusplus: true*/
"use strict";

var ws = require('ws');

exports.ChatClient = function (sock, user, chat) {

  var that = this,
    messageCallbacks = {};

  function kill(reason) {
    try {
      // kick from room
      chat.kill(that, reason);
      // don't invoke onclose
      sock.onclose = null;
      // close it.
      sock.close(1000, reason);
    } catch (e) {
      console.log("kill err: "
                  + user.email + ":" + e.toString());
    }
  }

  this.id = function () {
    return user.id;
  };

  this.desc = function (what) {
    return user[what];
  };

  this.publicInfo = function () {
    return {
      id      : this.id(),
      name    : this.desc('name'),
      display : this.desc('display'),
      gender  : this.desc('gender'),
      picture : this.desc('picture')
    };
  };

  this.onMessage = function (type, callback) {
    messageCallbacks[type] = callback;
  };

  this.send = function (type, data) {
    if (sock.readyState === ws.OPEN) {
      sock.send(
        JSON.stringify({type: type, data: data}),
        function (err) {
          if (err) {
            sock.terminate(); // no mercy.
          }
        }
      );
    } else {
      kill("connection lost");
    }
  };

  sock.onchatmessage = function (message) {
    var data;
    try {
      data = JSON.parse(message.data);
    } catch (e) {return kill("sent message not json"); }
    if (messageCallbacks[data.type] === undefined) {
      kill("sent message type '" + data.type + "' not valid.");
    } else {
      messageCallbacks[data.type](data.data, that);
      // debug
      try {
      } catch (err) {
        kill("exception: " + err);
      }
    }
  };

  sock.onclose = function () {
    chat.kill(that, "connection closed.");
  };

};
