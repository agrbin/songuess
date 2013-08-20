/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require("./clock.js"),
  config = require("./config.js").chat,
  ChatRoom = require("./chat_room.js").ChatRoom,
  ChatClient = require("./chat_client.js").ChatClient;

exports.Chat = function (media) {
  var
    that = this,
    rooms = {},
    where_is = {};

  function log(msg) {
    console.log(clock.time() + ": " + msg);
  }

  function assertType(object, type) {
    if (!(object instanceof type)) {
      throw ":" + type;
    }
  }

  this.getRoomByName = function (name) {
    return rooms[name];
  };

  this.roomNameExists = function (name) {
    if (rooms.hasOwnProperty(name)) {
      return true;
    }
    return false;
  };

  // add room to a list of rooms.
  this.createRoom = function (roomDescriptor) {
    var name = roomDescriptor.name, room;
    if (that.roomNameExists(name)) {
      throw "room already exists";
    }
    room = new ChatRoom(roomDescriptor, that);
    rooms[name] = room;
    console.log("new room created " + name);
  };

  // pop room from a list of rooms (when user requests so.)
  this.removeRoom = function (room) {
    assertType(room, ChatRoom);
    if (!room.isEmpty()) {
      throw "removing non empty room";
    }
    if (that.roomNameExists(room.name)) {
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
    if (srcRoom === destRoom) {
      return;
    }
    srcRoom.leave(client, "going to " + destRoom.desc.name);
    where_is[client.id()] = destRoom;
    destRoom.enter(client);
  };

  // this is called when connection to a client dies.
  this.kill = function (client, reason) {
    assertType(client, ChatClient);
    this.whereIs(client).leave(client, reason);
    delete where_is[client.id()];
  };

  this.connect = function (wsock, user) {
    var bio = false;
    wsock.onMessageType("initial_room", function (data) {
      var client, room;
      if (bio) {
        return wsock.sendError("you call 'initial_room' successfuly only once.");
      }
      if (!that.roomNameExists(data)) {
        return wsock.sendError("no such room", 1);
      }
      // entering the room
      log(user.email + " initial room " + data);
      client = new ChatClient(wsock, user, that);
      where_is[client.id()] = rooms[data];
      rooms[data].enter(client);
      bio = true;
    });
    wsock.onMessageType("create_room", function (data) {
      media.expandPlaylist(data, function (playlist, err) {
        if (err) {
          wsock.sendError(err);
        } else {
          data.room.playlist = playlist;
          that.createRoom(data.room);
          wsock.sendType("create_room", true);
        }
      });
    });
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

  (function () {
    // create root room.
    that.createRoom({
      name: "#root",
      desc: "root room",
      playlist: []
    });
  }());

};
