/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  proxyConfig = require('./config.js').proxy,
  Syncer = require('./syncer.js').Syncer,
  randomRange = require('./statistics.js').randomRange,
  AnswerChecker = require('./answer_checker.js'),
  mediaAuthenticator = new (require('./auth.js').MediaAuthenticator)(),
  HostSocket = require('./host_socket.js').HostSocket;

exports.ChatRoom = function (desc, chat, proxy) {

  var
    that = this,
    clients = {},
    localPersonData = {},
    numberOfClients = 0,
    answerChecker,
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
      whoNextVotes : null,
      hintShowed : null
    };

  function packRoomState() {
    var id, sol = {
      desc : {
        name : desc.name,
        desc : desc.desc,
        streamFromMiddle: desc.streamFromMiddle
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
        roomState.hintShowed = false;
      }, Math.max(0, startTime - clock.clock()));
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
      return client.error("No such room: " + data, 1);
    }
    chat.move(client, chat.whereIs(client), chat.getRoomByName(data));
  }

  // Hides all alphabetic characters except for vowels.
  function calcWordHint(word) {
    word = word.toLowerCase();
    // Start the hint by removing all the alphabetic characters.
    let hint = word.replace(/[a-z]/g, '.');
    for (let i = 0; i < word.length; ++i) {
      // If this was a vowel, bring it back from the original string.
      if (/[aeiouäëöü]/.test(word[i])) {
        hint[i] = word[i];
      }
    }
    return hint;
  }

  function calcHint(currentItem) {
    let words = currentItem.title.split(' ');
    return words.map(w => calcWordHint(w)).join(' ');
  }

  function onIDontKnow(data, client) {
    if (roomState.state !== "playing" && roomState.state !== "playon") {
      return;
    }
    if (roomState.whoNextVotes.hasOwnProperty(client.id())) {
      return;
    }
    roomState.whoNextVotes[client.id()] = 1;
    ++roomState.nextVotes;
    if (roomState.nextVotes >= 1 + Math.floor(numberOfClients / 2)) {
      if (roomState.hintShowed === false) {
        that.broadcast('called_i_dont_know', {
          who: client.id(),
          hint: calcHint(currentItem),
          when : data.when,
          state : roomState.state
        });
        roomState.hintShowed = true;
        // Reset the voting. We want another majority in order to skip the song
        // after the hint was displayed.
        roomState.whoNextVotes = {};
        roomState.nextVotes = 0;
      } else {
        that.broadcast('called_i_dont_know', {
          who: client.id(),
          answer: currentItem,
          when : data.when,
          state : roomState.state
        });
        roomState.lastScore = null;
        playNext();
      }
    } else {
      that.broadcast('called_i_dont_know', {
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

  this.broadcastRaw = function (data) {
    var id;
    for (id in clients) {
      clients[id].sendRaw(data);
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
    clients[client.id()] = client;
    client.setRoom(that);
    initLocalData(client);
    client.local('num', client.local('num') + 1);
    if (client.local('num') > 3) {
      return client.error("An account present too many times in a room.");
    }

    this.broadcast('new_client', client.publicInfo(), client);

    client.send('room_state', packRoomState());
    client.onMessage('say', onSay);
    client.onMessage('sbeep', onSBeep);
    client.onMessage('sskew', onSSkew);
    client.onMessage('new_room', onNewRoom);
    client.onMessage('idk', onIDontKnow);
    client.onMessage('token', onToken);
    client.onMessage('reset_score', onResetScore);
    client.onMessage('honor', onHonor);
    client.onMessage('sync_start', onStartSync);
    client.onMessage('change_group', onChangeGroup);

    if (hostSocket === null) {
      console.log('enter: hostSocket is null');
    } else {
      if (hostSocket.currentAudioData().length > 0) {
        console.log('enter: sending currentAudioData to new client');
        client.sendRaw(hostSocket.currentAudioData());
      } else {
        console.log('enter: currentAudioData is empty');
      }
    }
  };

  // pop a client from a list of clients and
  // notify all other clients about the popping :)
  this.leave = function (client, reason) {
    numberOfClients--;
    client.local('num', client.local('num') - 1);
    delete clients[client.id()];
    if (numberOfClients == 0) {
      roomState.state = "dead";
      roomState.songStart = null;
      roomState.lastSong = null;
      if (hostSocket !== null) {
        hostSocket.closeSocket();
        this.detachHostSocket();
      }
    }
    this.broadcast('old_client', [client.id(), reason]);
  };

  this.packWhoData = function () {
    var id, client, sol = {};
    for (id in clients) {
      if (clients.hasOwnProperty(id)) {
        client = clients[id];
        sol[ client.desc('display') ] = client.local('score');
      }
    }
    return sol;
  };

  this.attachHostSocket = function(socket) {
    hostSocket = new HostSocket(socket, that, playNext, songEndedHandler);
  };

  this.detachHostSocket = function() {
    hostSocket = null;
    // This will also make sure the music fades out gradually on the clients.
    this.broadcast('clear_host_chunks');
    info("The connection to host was broken.");
  };

  this.isEmpty = function() {
    return numberOfClients == 0;
  };

  (function () {
    answerChecker = new AnswerChecker({});
  }());
};
