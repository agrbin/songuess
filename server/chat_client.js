/*jslint indent: 2, plusplus: true*/
"use strict";

var ws = require('ws');

exports.ChatClient = function (wsock, user, chat) {

  var that = this,
    currentRoom;

  // when we initiate close.
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
    chat.kill(that, "connection lost.");
  });

  wsock.onSleepy(function (reason) {
    kill(reason);
  });

  this.setRoom = function (room) {
    currentRoom = room;
  };

  this.getRoom = function () {
    return currentRoom;
  };

  this.email = function () {
    return user.email;
  };

  this.id = function () {
    return user.id;
  };

  this.pid = function () {
    return user.id.split(".")[0];
  };

  this.local = function (field, set) {
    if (set !== undefined) {
      user.local[field] = set;
      currentRoom.localDataChanged(that);
    }
    return user.local[field];
  };

  this.desc = function (what, set) {
    if (set !== undefined) {
      user[what] = set;
    }
    return user[what];
  };

  this.publicInfo = function () {
    return {
      id      : this.id(),
      name    : this.desc('name'),
      display : this.desc('display'),
      gender  : this.desc('gender'),
      picture : this.desc('picture'),
      ping    : this.desc('ping'),
      score   : this.local('score'),
      group   : this.local('group')
    };
  };

  this.onMessage = function (type, callback) {
    wsock.onMessageType(type, function (data) {
      callback(data, that);
    });
  };

  this.error = function (error, code, done) {
    wsock.sendError(error, code, function (res, err) {
      if (err) {
        kill(err);
      } else if (done) {
        done(res);
      }
    });
  };

  this.send = function (type, data, done) {
    wsock.sendType(type, data, function (res, err) {
      if (err) {
        kill(err);
      } else if (done) {
        done(res);
      }
    });
  };

};

