/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  Streamer = require('./streamer.js').Streamer,
  AnswerChecker = require('./answer_checker.js'),
  PlaylistIterator = require('./shuffle_playlist_iterator.js');

exports.ChatRoom = function (desc, chat, proxy) {
  var
    that = this,
    clients = {},
    numberOfClients = 0,
    playlistIterator = new PlaylistIterator(desc.playlist),
    answerChecker = new AnswerChecker({}), // no options for now
    streamer = new Streamer(chat.media, chunkHandler, songEndedHandler);

  function chunkHandler(chunkInfo) {
    proxy.proxify(chunkInfo.url, function (url) {
      chunkInfo.url = url;
      that.broadcast('chunk', chunkInfo);
    });
  }

  function songEndedHandler() {
    that.broadcast('song_ended', {
      answer : playlistIterator.currentItem(),
      when : clock.clock()
    });
    playNext();
  }

  function packRoomState() {
    var id, sol = {
      desc : desc,
      users : {},
      started : streamer.getSongStartedTime() || null
    };
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        sol.users[id] = clients[id].publicInfo();
      }
    }
    return sol;
  }

  this.desc = desc;

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
    numberOfClients++;
    if (numberOfClients === 1) {
      playNext();
    }
    clients[client.id()] = client;
    client.send("room_state", packRoomState());
    client.onMessage("say", onSay);

    // handle moving to another room
    client.onMessage("new_room", function (data, client) {
      if (!chat.roomNameExists(data)) {
        return client.error("no such room " + data + ".", 1);
      }
      chat.move(
        client, chat.whereIs(client), chat.getRoomByName(data)
      );
    });

    // register next callback
    client.onMessage('next', function (data, client) {
      that.broadcast('called_next', {
        who: client.id(),
        answer: playlistIterator.currentItem(),
        when : data.when
      });
      playNext();
    });

    // register score reset
    client.onMessage('reset_score', function (data, client) {
      client.correctAnswers = 0;
      that.broadcast('called_reset', {
        who: client.id(),
        when: data.when
      });
    });
  };

  // pop a client from a list of clients and
  // notify all other clients about the popping :)
  this.leave = function (client, reason) {
    numberOfClients--;
    delete clients[client.id()];
    if (!numberOfClients) {
      streamer.stop();
    }
    this.broadcast('old_client', [client.id(), reason]);
  };

  function info(text) {
    that.broadcast('say', {
      when : clock.clock(),
      to   : null,
      from : null,
      what : text
    });
  }

  function playNext() {
    if (!desc.playlist.length) {
      return;
    }
    streamer.play(playlistIterator.nextItem(), function (songStartTime) {
      that.broadcast('next_song_announce', songStartTime);
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
    that.broadcast('say', data);

    if (answerChecker.checkAnswer(playlistIterator.currentItem(), data.what)) {
      client.correctAnswers += 1;
      that.broadcast('correct_answer', {
        who: client.id(),
        score: client.correctAnswers,
        answer: playlistIterator.currentItem(),
        when : data.when
      });
      playNext();
    }
  }

};
