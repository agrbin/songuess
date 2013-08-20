/*jslint indent: 2, plusplus: true*/
"use strict";

var config = require("./config.js").media,
  request = require('request');

exports.MediaGateway = function (chat) {

  var that = this;

  this.serve = function (wsock) {
    wsock.onMessageType("media", function (query) {
      var
        handler = function (result, err) {
          if (err) {
            wsock.sendError(err);
          } else {
            wsock.sendType("media", result);
          }
        },
        map = {
          "ls": that.processLs,
          "new_room": that.processNewRoom
        },
        processor = map[query.type];

      if (processor === undefined) {
        wsock.sendError("unknown media query type: " + query.type);
      } else {
        return map[query.type](query, handler);
      }
    });
  };

  this.api = function (server, method, param, done) {
    var url;
    if (config[server] === undefined) {
      return done(null, "no such server");
    }
    url = config[server].endpoint + method;
    url += encodeURIComponent(param);
    request({url: url, timeout: 500}, function (e, response, body) {
      if (!e && response.statusCode === 200) {
        try {
          done(JSON.parse(body));
        } catch (err) {
          done(null, "error while querying media: " + err);
        }
      } else {
        return done(null, "media server not available.");
      }
    });
  };

  this.expandApi = function (server, input, onResult) {
    var url;
    if (config[server] === undefined) {
      return onResult(null, null, "no such server");
    }
    url = config[server].endpoint + "/expand/";
    request({uri: url, body: input}, function (e, response, body) {
      if (!e && response.statusCode === 200) {
        try {
          onResult(JSON.parse(body), server);
        } catch (err) {
          onResult(null, null, "error while querying media: " + err);
        }
      } else {
        return onResult(null, null, "media server not available.");
      }
    });
  };

  function getMediaProviders() {
    var name, sol = [];
    for (name in config) {
      if (config.hasOwnProperty(name)) {
        sol.push({
          name : name,
          apath : [name],
          type : "server",
          desc : config[name].desc
        });
      }
    }
    return sol;
  }

  function processLs(query, done) {
    var
      server,
      path;

    if (!query.hasOwnProperty('apath')) {
      return done(null, "ls query has no apath field");
    }

    if (query.apath.length === 0) {
      return done(getMediaProviders());
    }

    server = query.apath[0];
    path = "/" + query.apath.slice(1).join("/");

    that.api(server, "/ls/?path=", path, function (entries, err) {
      var i;
      if (err) {
        return done(null, err);
      }
      for (i = 0; i < entries.length; ++i) {
        entries[i].apath = query.apath.concat(entries[i].name);
      }
      done(entries);
    });
  }

  function dispatchByServers(playlist) {
    var
      byServers = {},
      server,
      it;
    for (it = 0; it < playlist.length; ++it) {
      if (!playlist[it].length) {
        throw "playlist have invalid apath";
      }
      server = playlist[it][0];
      if (!byServers.hasOwnProperty(server)) {
        byServers[server] = [];
      }
      byServers[server].push(
        {path: "/" + playlist[it].slice(1).join("/")}
      );
    }
    return byServers;
  }

  /*
   * {
   *  name :
   *  desc :
   *  playlist : [
   *    { server:, id:, artist:, title:, album:, ...}
   *  ]
   * }
   */
  function registerNewRoom(room, done) {
    chat.createRoom(room);
    done(true);
  }

  /*
  type:
  room: {name:, desc:}
  playlist: [ apath, apath, ... ]

  amo prvo expandat sve.
  */
  function processNewRoom(query, done) {
    var expanded = [], callsLeft = 0;

    if (!query.room.name.length) {
      return done(null, "room name should not be empty.");
    }
    if (query.room.name.substr(0, 1) !== "#") {
      return done(null, "room name should start with #.");
    }

    function finish() {
      if (expanded.length === 0) {
        return done(null, "playlist should not be empty");
      }
      query.room.playlist = expanded;
      registerNewRoom(query.room, done);
    }

    function partialDone(partialExpanded, server, err) {
      var it;
      if (err) {
        return done(null, err);
      }
      for (it = 0; it < partialExpanded.length; ++it) {
        partialExpanded[it].server = server;
        expanded.push(partialExpanded[it]);
      }
      if (!--callsLeft) {
        return finish();
      }
    }

    function start() {
      var byServers, body, server;
      byServers = dispatchByServers(query.playlist);
      for (server in byServers) {
        if (byServers.hasOwnProperty(server)) {
          ++callsLeft;
          body = JSON.stringify(byServers[server]);
          that.expandApi(server, body, partialDone);
        }
      }
      if (!callsLeft) {
        done(null, "playlist should not be empty");
      }
    }

    start();
  }

};
