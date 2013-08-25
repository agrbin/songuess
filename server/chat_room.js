/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  Streamer = require('./streamer.js').Streamer,
  AnswerChecker = require('./answer_checker.js'),
  PlaylistIterator = require('./shuffle_playlist_iterator.js'),
  mediaAuthenticator = new (require('./auth.js').MediaAuthenticator)();

exports.ChatRoom = function (desc, chat, proxy) {

  var
    that = this,
    clients = {},
    localPersonData = {},
    numberOfClients = 0,
    playlistIterator,
    answerChecker,
    streamer,

    // "dead", "playing", "suspense"
    // if state is playing, when did the song started?
    // if state is suspense, when will the next song start?
    roomState = {
      state : "dead",
      songStart : null,
      lastSong : null,
      lastScore : null
    };

  function packRoomState() {
    var id, sol = {
      desc : {
        name : desc.name,
        desc : desc.desc,
        playlist : {
          length : desc.playlist.length
        }
      },
      users : {},
      state : roomState
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
    streamer.play(playlistIterator.nextItem(), function (startTime, err) {
      if (err) {
        console.log("tried to play next: " + err);
        info("tried to play next with error (retry in 5s): " + err);
        setTimeout(playNext, 5000);
      } else {
        roomState.state = "after";
        roomState.lastSong = playlistIterator.lastItem();
        roomState.songStart = null;

        setTimeout(function() {
          roomState.state = "suspense";
          roomState.songStart = startTime;
          that.broadcast('next_song_announce', roomState);
        }, Math.max(0, startTime - clock.clock() - 6000));

        setTimeout(function() {
          roomState.state = "playing";
        }, Math.max(0, startTime - clock.clock()));
      }
    });
  }

  function info(text, to) {
    if (to) {
      to.send('say', {
        when : clock.clock(),
        to   : to.id(),
        from : null,
        what : text
      });
    } else {
      that.broadcast('say', {
        when : clock.clock(),
        to   : null,
        from : null,
        what : text
      });
    }
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
    // only if state is playing check for correct answer.
    if (roomState.state !== "playing") {
      return;
    }
    if (answerChecker.checkAnswer(playlistIterator.currentItem(), data.what)) {
      client.local('score', client.local('score') + 1);
      roomState.lastScore = client.id();
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
    if (roomState.state !== "playing") {
      return;
    }
    that.broadcast('called_next', {
      who: client.id(),
      answer: playlistIterator.currentItem(),
      when : data.when
    });
    playNext();
  }

  function onToken(data, client) {
    client.send(
      'token',
      mediaAuthenticator.issueToken(client.desc('email'))
    );
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

  function onHonor(data, client) {
    var target = that.getClientByName(data);
    if (!target) {
      return info("unknown or multiple match: " + data + ".", client);
    }
    if (roomState.state !== "after") {
      return info("can't honor in this moment.", client);
    }
    if (target === client) {
      return info("you are honored.. gee, well done!", client);
    }
    if (client.id() !== roomState.lastScore) {
      return info("you didn't made the last score.", client);
    }
    client.local('score', client.local('score') - 1);
    target.local('score', target.local('score') + 1);
    roomState.lastScore = target.id();
    that.broadcast('honored', {from: client.id(), to: target.id()});
  }

  function songEndedHandler() {
    that.broadcast('song_ended', {
      answer : playlistIterator.currentItem(),
      when : clock.clock()
    });
    playNext();
  }

  function getClientByField(name, field) {
    var id, sol, k = 0;
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        if (answerChecker.checkName(clients[id].desc(field), name)) {
          sol = clients[id];
          ++k;
        }
      }
    }
    return k === 1 ? sol : null;
  }

  this.desc = desc;

  this.getClientByName = function (name) {
    var sol, fields = "";
    if (sol = getClientByField(name, "display")) {
      return sol;
    }
    if (sol = getClientByField(name, "name")) {
      return sol;
    }
    return null;
  };

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
    client.onMessage('token', onToken);
    client.onMessage('reset_score', onResetScore);
    client.onMessage('honor', onHonor);
  };

  // pop a client from a list of clients and
  // notify all other clients about the popping :)
  this.leave = function (client, reason) {
    numberOfClients--;
    delete clients[client.id()];
    if (!numberOfClients) {
      roomState.state = "dead";
      roomState.songStart = null;
      roomState.lastSong = null;
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
