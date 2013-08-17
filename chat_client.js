/*jslint indent: 2, plusplus: true*/
"use strict";

var ws = require('ws');

exports.ChatClient = function (wsock, user, chat) {

  var that = this;

  // we will initiate close.
  function kill(reason) {
    // remove all listeners from this socket
    // (client: don't speak)
    wsock.removeListeners();
    // change close reason.
    // this will tell others about the closing
    wsock.onClose(function () {
      chat.kill(that, reason);
    });
    // close it.
    // this will tell the client about the closing.
    wsock.close(reason);
  }

  // when client closes the connection, notify
  // others about that.
  wsock.onClose(function () {
    chat.kill(that, "connection closed by client.");
  });

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
    wsock.onMessageType(type, function (data) {
      callback(data, that);
    });
  };

  this.send = function (type, data) {
    wsock.sendType(type, data);
  };

};
