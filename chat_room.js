/*jslint indent: 2, plusplus: true*/
"use strict";

var clock = require("./clock.js");

exports.ChatRoom = function (desc, chat) {

  var that = this,
    clients = {};

  function packRoomState() {
    var id, sol = {};
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        sol[id] = clients[id].publicInfo();
      }
    }
    return sol;
  }

  this.name = desc.name;

  this.broadcast = function (type, msg) {
    var id;
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        clients[id].send(type, msg);
      }
    }
  };

  // add a client to a list of clients and
  // notify all clients about the adding.
  this.enter = function (client) {
    this.broadcast("new_client", client.publicInfo());
    clients[client.id()] = client;
    client.send("room_state", packRoomState());
    client.onMessage("say", onSay);
  };

  // pop a client from a list of clients and
  // notify all other clients about the popping :)
  this.leave = function (client, reason) {
    delete clients[client.id()];
    this.broadcast("old_client", [client.id(), reason]);
  };

  function info(text) {
    that.broadcast("say", {
      when : clock.clock(),
      to   : null,
      from : null,
      what : text
    });
  }

  function onSay(data, client) {
    // debug
    if (!clients.hasOwnProperty(data.from)) {
      throw "from not in this room";
    }
    if (data.from !== client.id()) {
      throw "from is not you";
    }
    if (data.to !== null && !clients.hasOwnProperty(data.to)) {
      throw "to specified, but not in this room";
    }
    that.broadcast("say", data);
  }

};
