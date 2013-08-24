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
    localPersonData = {},
    numberOfClients = 0,
    playlistIterator,
    answerChecker,
    streamer;

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

  function playNext() {
    if (!desc.playlist.length) {
      return;
    }
    streamer.play(playlistIterator.nextItem(), function (songStartTime) {
      that.broadcast('next_song_announce', songStartTime);
    });
  }

  function info(text) {
    that.broadcast('say', {
      when : clock.clock(),
      to   : null,
      from : null,
      what : text
    });
  }

  // if local record for this person (pid) is missing,
  // initialize to {}.
  // assign that record to a client.
  function initLocalData(client) {
    if (!localPersonData.hasOwnProperty(client.pid())) {
      localPersonData[client.pid()] = {
        score : 0
      };
    }
    client.desc('local', localPersonData[client.pid()]);
  }

  function onSay(data, client) {
    // debug
    if (!clients.hasOwnProperty(data.from)) {
      console.log("internal: from not in this room");
      throw "internal: from not in this room";
    }
    if (data.from !== client.id()) {
      throw "from is not you";
    }
    if (data.to !== null && !clients.hasOwnProperty(data.to)) {
      throw "to specified, but not in this room";
    }
    that.broadcast('say', data);
    if (answerChecker.checkAnswer(playlistIterator.currentItem(), data.what)) {
      client.local('score', client.local('score') + 1);
      that.broadcast('correct_answer', {
        who: client.id(),
        answer: playlistIterator.currentItem(),
        when : data.when
      });
      playNext();
    }
  }

  function onNewRoom(data, client) {
    if (!chat.roomNameExists(data)) {
      return client.error("no such room " + data + ".", 1);
    }
    chat.move(client, chat.whereIs(client), chat.getRoomByName(data));
  }

  function onNext(data, client) {
    that.broadcast('called_next', {
      who: client.id(),
      answer: playlistIterator.currentItem(),
      when : data.when
    });
    playNext();
  }

  function onResetScore(data, client) {
    client.local('score', 0);
    that.broadcast('called_reset', {
      who: client.id(),
      when: data.when
    });
  }

  function chunkHandler(chunkInfo) {
    proxy.proxify(chunkInfo.url, function (url, url2) {
      chunkInfo.url = url;
      chunkInfo.backupUrl = url2;
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

  this.desc = desc;

  this.broadcast = function (type, msg, except) {
    var id;
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        if (!(except && except.id() === id)) {
          clients[id].send(type, msg);
        }
      }
    }
  };

  // this is triggered from ChatClient::local
  // function will copy local data to all other clients
  // with same pid and to room's localPersonData
  this.localDataChanged = function (client) {
    var pid = client.pid(), id;
    localPersonData[pid] = client.desc('local');
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        if (clients[id].pid() === pid) {
          clients[id].desc('local', localPersonData[pid]);
        }
      }
    }
  };

  // add a client to a list of clients and
  // notify all clients about the adding.
  this.enter = function (client) {
    numberOfClients++;
    if (numberOfClients === 1) {
      playNext();
    }
    clients[client.id()] = client;
    client.setRoom(that);
    initLocalData(client);

    this.broadcast('new_client', client.publicInfo(), client);
    client.send('room_state', packRoomState());
    client.onMessage('say', onSay);
    client.onMessage('new_room', onNewRoom);
    client.onMessage('next', onNext);
    client.onMessage('reset_score', onResetScore);
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

  (function () {
    playlistIterator = new PlaylistIterator(desc.playlist);
    answerChecker = new AnswerChecker({});
    streamer = new Streamer(chat.media, chunkHandler, songEndedHandler);
  }());
};
