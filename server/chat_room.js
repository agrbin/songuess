/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  proxyConfig = require('./config.js').proxy,
  Syncer = require('./syncer.js').Syncer,
  randomRange = require('./statistics.js').randomRange,
  Streamer = require('./streamer.js').Streamer,
  AnswerChecker = require('./answer_checker.js'),
  PlaylistIterator = require('./shuffle_playlist_iterator.js'),
  mediaAuthenticator = new (require('./auth.js').MediaAuthenticator)(),
  HostSocket = require('./host_socket.js').HostSocket;

exports.ChatRoom = function (desc, chat, proxy) {

  var
    that = this,
    clients = {},
    localPersonData = {},
    numberOfClients = 0,
    playlistIterator,
    answerChecker,
    streamer,
    fixed_id3_tags = chat.media.getFixedId3Tags(),
    currentItem = null,
    hostSocket = null,

    // "dead", "playing", "playon", "after", "suspense"
    // if state is playing, when did the song start?
    // if state is suspense, when will the next song start?
    // if state is playing or playon, how many and who voted next?
    roomState = {
      state : "dead",
      songStart : null,
      lastSong : null,
      lastScore : null,
      nextVotes : null,
      whoNextVotes : null
    };

  function packPlaylist() {
    var playlist = desc.playlist, sol = [], it = 0, bio = {}, key;
    for (it = 0; it < playlist.length; ++it) {
      key = JSON.stringify([playlist[it].artist, playlist[it].album]);
      if (!bio.hasOwnProperty(key)) {
        bio[key] = 0;
      }
      ++bio[key];
    }
    for (key in bio) {
      sol.push( [JSON.parse(key), bio[key]] );
    }
    return sol;
  }

  function packRoomState() {
    var id, sol = {
      desc : {
        name : desc.name,
        desc : desc.desc,
        playlist : {
          length : desc.playlist.length,
          content : packPlaylist()
        },
        streamFromMiddle: desc.streamFromMiddle,
        isHostRoom: desc.isHostRoom
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

  function playNextForHostRoom() {
    if (hostSocket == null) {
      return;
    }

    roomState.state = "after";
    roomState.songStart = null;
    
    hostSocket.playNext(function(err, nextSongItem) {
      var startTime = clock.clock() + 8000;

      currentItem = nextSongItem;

      setTimeout(function() {
        roomState.state = "suspense";
        roomState.songStart = startTime;
        that.broadcast('next_song_announce', roomState);
      }, Math.max(0, startTime - clock.clock() - 6000));

      setTimeout(function() {
        roomState.state = "playing";
        roomState.nextVotes = 0;
        roomState.whoNextVotes = {};
      }, Math.max(0, startTime - clock.clock()));
    });
  }

  function playNext() {
    if (desc.isHostRoom) {
      playNextForHostRoom();
      return;
    } else if (!desc.playlist.length) {
      return;
    }
    roomState.state = "after";
    roomState.lastSong = currentItem;
    roomState.songStart = null;

    streamer.play(playlistIterator.nextItem(), function (startTime, err) {
      if (err) {
        console.log("tried to play next: " + err);
        info("Tried to play next with error (retry in 5s): " + err);
        setTimeout(playNext, 5000);
      } else {
        currentItem = playlistIterator.currentItem();

        setTimeout(function() {
          roomState.state = "suspense";
          roomState.songStart = startTime;
          that.broadcast('next_song_announce', roomState);
        }, Math.max(0, startTime - clock.clock() - 6000));

        setTimeout(function() {
          roomState.state = "playing";
          roomState.nextVotes = 0;
          roomState.whoNextVotes = {};
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
        score : 0,
        row : 0, // number of correct answers in a row
        num : 0, // number of your accounts connected
        group : 0 // what is your group?
      };
    }
    client.desc('local', localPersonData[client.pid()]);
  }

  function grantScore(client) {
    client.local('score', client.local('score') + 1);
    // update in-a-row
    if (roomState.lastScore === client.id()) {
      client.local('row', client.local('row') + 1);
    } else {
      if (clients.hasOwnProperty(roomState.lastScore)) {
        clients[roomState.lastScore].local('row', 0);
      }
      client.local('row', 1);
    }
    roomState.lastScore = client.id();
    if (client.local('row') > 2) {
      that.broadcast('row', {who:client.id(), row:client.local('row')});
    }
  }

  function onSBeep(data, client) {
    onSonicMessageHelper("sbeep", data);
  }

  function onSSkew(data, client) {
    onSonicMessageHelper("sskew", data);
  }

  function onSonicMessageHelper(type, data) {
    if (data.to !== null && !clients.hasOwnProperty(data.to)) {
      throw "to specified, but not in this room";
    }
    clients[data.to].send(type, data);
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
    if (answerChecker.checkAnswer(currentItem, data.what)) {
      var next_state = "after";
      grantScore(client);
      if (data.what.indexOf('#playon') != -1) {
        next_state = "playon";
      }
      that.broadcast('correct_answer', {
        who: client.id(),
        answer: currentItem,
        when : data.when,
        state : next_state
      });
      if (next_state !== "playon") {
        playNext();
      } else {
        roomState.state = next_state;
      }
    }
  }

  function onNewRoom(data, client) {
    if (!chat.roomNameExists(data)) {
      return client.error("no such room " + data + ".", 1);
    }
    chat.move(client, chat.whereIs(client), chat.getRoomByName(data));
  }

  function onNext(data, client) {
    if (roomState.state !== "playing" && roomState.state !== "playon") {
      return;
    }
    if (roomState.whoNextVotes.hasOwnProperty(client.id())) {
      return;
    }
    roomState.whoNextVotes[client.id()] = 1;
    ++roomState.nextVotes;
    if (roomState.nextVotes >= 1 + Math.floor(numberOfClients / 2)) {
      that.broadcast('called_next', {
        who: client.id(),
        answer: currentItem,
        when : data.when,
        state : roomState.state
      });
      roomState.lastScore = null;
      playNext();
    } else {
      that.broadcast('called_next', {
        who: client.id(),
        when : data.when
      });
    }
  }

  function onToken(data, client) {
    client.send(
      'token',
      mediaAuthenticator.issueToken(client.desc('email'))
    );
  }

  function onResetScore(data, client) {
    client.local('score', 0);
    client.local('row', 0);
    that.broadcast('called_reset', {
      who: client.id(),
      when: data.when
    });
  }

  function chunkHandler(chunkInfo) {
    proxy.proxify(chunkInfo.url, function (url, url2) {
      var id;
      chunkInfo.url = url;
      chunkInfo.backupUrl = url2;
      for (id in clients) {
        if (clients.hasOwnProperty(id)) {
          setTimeout(
            clients[id].send.bind(this, "chunk", chunkInfo),
            1000 * randomRange(
              proxyConfig.throttleStreamOff,
              proxyConfig.throttleStreamAmp
            )
          );
        }
      }
    });
  }

  function onFixLast(data, client) {
    if (!data.fixed_item ||
        !data.fixed_item.server || !data.fixed_item.id) {
      return info("Fixed message is broken.", client);
    }
    // Remove empty strings.
    data.fixed_item = fixed_id3_tags.sanitizeItem(data.fixed_item);
    // Check that alt titles are in order.
    if (!fixed_id3_tags.validAltTitle(data.fixed_item)) {
      return info("Add alternate titles in order: title, title2, title3, ...",
          client);
    }
    if (!fixed_id3_tags.fixItem(client, data.fixed_item)) {
      return info(
          "You don't have permissions for fixing song on this media server.",
          client);
    } else {
      // Fix the reference to the lastSong in the room state.
      // This fix was added because of the following bug:
      // song plays
      // > /next
      // Correct answer was A.
      // > /ch title  B
      // > /info (shows that last answer was B)
      // Get ready!
      // > /info (shows that last answer was A) <-- bug!
      if (roomState.lastSong) {
        roomState.lastSong = fixed_id3_tags.getFixedItem(roomState.lastSong);
      }
      that.broadcast('fixed_last',
          {who: client.id(), fixed_item: data.fixed_item});
    }
  }

  function onHonor(data, client) {
    var target;
    if (!clients.hasOwnProperty(data.to)) {
      return info("Target acc is not in da klub.", client);
    }
    target = clients[data.to];
    if (roomState.state !== "after" && roomState.state !== "playon") {
      return info("Can't honor in this moment.", client);
    }
    if (target === client) {
      return info("You are honored.. gee, well done!", client);
    }
    if (client.id() !== roomState.lastScore) {
      return info("You didn't make the last score.", client);
    }
    client.local('score', client.local('score') - 1);
    target.local('score', target.local('score') + 1);
    roomState.lastScore = target.id();
    that.broadcast('honored', {from: client.id(), to: target.id()});
  }

  function songEndedHandler() {
    that.broadcast('song_ended', {
      answer : currentItem,
      when : clock.clock(),
      state : roomState.state
    });
    roomState.lastScore = null;
    playNext();
  }

  // used as a wrapper to Syncer class.
  function SyncSocketWrap(client) {
    var that = this;
    this.onmessage = null;
    this.send = function (msg, done) {
      client.send("sync", msg, done);
    }
    client.onMessage("sync", function (msg) {
      if (that.onmessage) {
        that.onmessage({data:msg});
      }
    });
  }

  function onStartSync(data, client) {
    Syncer(
      new SyncSocketWrap(client),
      function() {}
    );
  }

  function onChangeGroup(data, client) {
    if (client.local('group') === data.group) {
      return;
    }
    client.local('group', data.group);
    that.broadcast('change_group', {who:client.id(), group:data.group});
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
    client.local('num', client.local('num') + 1);
    if (client.local('num') > 3) {
      return client.error("too many accounts in room");
    }

    this.broadcast('new_client', client.publicInfo(), client);
    client.send('room_state', packRoomState());
    client.onMessage('say', onSay);
    client.onMessage('sbeep', onSBeep);
    client.onMessage('sskew', onSSkew);
    client.onMessage('new_room', onNewRoom);
    client.onMessage('next', onNext);
    client.onMessage('token', onToken);
    client.onMessage('reset_score', onResetScore);
    client.onMessage('honor', onHonor);
    client.onMessage('sync_start', onStartSync);
    client.onMessage('change_group', onChangeGroup);
    client.onMessage('fix_last', onFixLast);
  };

  // pop a client from a list of clients and
  // notify all other clients about the popping :)
  this.leave = function (client, reason) {
    numberOfClients--;
    client.local('num', client.local('num') - 1);
    delete clients[client.id()];
    if (!numberOfClients) {
      roomState.state = "dead";
      roomState.songStart = null;
      roomState.lastSong = null;
      if (streamer !== null) {
        streamer.stop();
      }
    }
    this.broadcast('old_client', [client.id(), reason]);
  };

  this.packWhoData = function () {
    var id, client, sol = {};
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        client = clients[id];
        sol[ client.desc('display') ]
          = client.local('score');
      }
    }
    return sol;
  };

  this.attachHostSocket = function(socket) {
    hostSocket = new HostSocket(socket, that, playNext, songEndedHandler);
  };

  this.detachHostSocket = function() {
    hostSocket = null;
  };

  (function () {
    answerChecker = new AnswerChecker({});

    if (desc.isHostRoom) {
      playlistIterator = null;
      streamer = null;
    } else {
      playlistIterator = new PlaylistIterator(
        desc.playlist,
        fixed_id3_tags);
      streamer = new Streamer(chat.media, chunkHandler,
        songEndedHandler, desc.streamFromMiddle);
    }
  }());
};
