/*jslint indent: 2, plusplus: true*/
"use strict";

var clock = require("./clock.js"),
  config = require("./config.js").chat,
  ChatRoom = require("./chat_room.js").ChatRoom,
  ChatClient = require("./chat_client.js").ChatClient;


exports.Chat = function () {

  var rootRoom = new ChatRoom({name: "root room"}, this),
    rooms = {"" : rootRoom},
    where_is = {};

  function log(msg) {
    console.log(clock.time() + ": " + msg);
  }

  function assertType(object, type) {
    if (!(object instanceof type)) {
      throw ":" + type;
    }
  }

  function roomNameExists(name) {
    if (rooms.hasOwnProperty(name)) {
      return true;
    }
    return false;
  }

  // add room to a list of rooms.
  this.createRoom = function (name, room) {
    assertType(room, ChatRoom);
    if (roomNameExists(name)) {
      throw "room already exists";
    }
    rooms[name] = room;
  };

  // pop room from a list of rooms (when user requests so.)
  this.removeRoom = function (room) {
    assertType(room, ChatRoom);
    if (!room.isEmpty()) {
      throw "removing non empty room";
    }
    if (roomNameExists(room.name)) {
      throw "room doesn't exists";
    }
    delete rooms[room.name];
  };

  // when client requests moving to another room.
  this.move = function (client, srcRoom, destRoom) {
    assertType(client, ChatClient);
    assertType(srcRoom, ChatRoom);
    assertType(destRoom, ChatRoom);
    if (this.whereIs(client) !== srcRoom) {
      throw "not in that room.";
    }
    srcRoom.leave(client);
    where_is[client.id()] = destRoom;
    destRoom.enter(client);
  };

  // this is called when connection to a client dies.
  this.kill = function (client, reason) {
    assertType(client, ChatClient);
    this.whereIs(client).leave(client, reason);
    delete where_is[client.id()];
  };

  this.connect = function (sock, user) {
    log(user.email + " connected.");
    var client = new ChatClient(sock, user, this);
    where_is[client.id()] = rootRoom;
    rootRoom.enter(client);
  };

  // @param client ChatClient
  // @returns ChatRoom where the client currently is.
  this.whereIs = function (client) {
    assertType(client, ChatClient);
    if (!where_is.hasOwnProperty(client.id())) {
      throw "not in where_is";
    }
    return where_is[client.id()];
  };

};
