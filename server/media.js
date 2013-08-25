/*jslint indent: 2, plusplus: true*/
"use strict";

var
  clock = require('./clock.js'),
  config = require('./config.js').media,
  request = require('request'),
  remoteAddr = require('./httpproxy.js').remoteAddr,
  mediaAuthenticator = new (require('./auth.js').MediaAuthenticator)();

exports.MediaGateway = function () {
  var that = this,
    servers = {};

  function log(what) {
    if (config.log) {
      console.log(what);
    }
  }

  function loadServersFromConfig() {
    for (var name in config.servers) {
      if (config.servers.hasOwnProperty(name)) {
        servers[name] = config.servers[name];
        servers[name].fixed = true;
        servers[name].last_seen = null;
      }
    }
  }

  function addServer(server, remoteIp) {
    if (server.fixed) {
      throw "your server can't be fixed";
    }
    if (server.access_point && server.access_point.endpoint !== null) {
      server.endpoint = server.access_point.endpoint;
      delete server.access_point;
    } else {
      server.endpoint = 'http://' + remoteIp
        + ':' + (server.access_point.listen_port || 80);
    }
    if (!config.trustServers.hasOwnProperty(remoteIp)) {
      if (server.owner !== mediaAuthenticator.checkToken(server.token)) {
        throw "can't check owner: token invalid.";
      }
    }
    if (servers.hasOwnProperty(server.name)) {
      var old = servers[server.name];
      if (old.owner !== server.owner) {
        throw "other owner has media server with that name.";
      }
      if (old.fixed) {
        if (old.endpoint !== server.enpoint) {
          throw "can't change endpoint of fixed server";
        }
        server.fixed = true;
      }
      if (servers[server.name].timeout) {
        clearTimeout(server.timeout);
      }
    } else {
      log("Media: new server " + server.name);
    }
    server.last_seen = clock.clock();
    servers[server.name] = server;
    return server.name;
  }

  function purgeOldServers() {
    for (var name in servers) {
      if (servers.hasOwnProperty(name)) {
        if (!servers[name].fixed) {
          if (clock.clock() - servers[name].last_seen
              > config.timeToPurge * 1000) {
            log("Media: server gone " + name);
            delete servers[name];
          }
        }
      }
    }
    setTimeout(purgeOldServers, config.timeToPurge * 1000);
  }

  function api(server, method, param, done) {
    var url;
    if (servers[server] === undefined) {
      return done(null, "no such server");
    }
    url = servers[server].endpoint + method;
    if (param) {
      url += encodeURIComponent(param);
    }
    request({url: url, timeout: config.timeout * 1000}, function (e, response, body) {
      if (!e && response.statusCode === 200) {
        try {
          done(JSON.parse(body));
        } catch (err) {
          done(null, "error while querying media: " + e);
        }
      } else {
        return done(null, "media server not available: " + e);
      }
    });
  }

  function getMediaProviders() {
    var name, sol = [];
    for (name in servers) {
      if (servers.hasOwnProperty(name)) {
        sol.push({
          name : name,
          apath : [name],
          type : "server",
          desc : servers[name].desc
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

    api(server, "/ls/?path=", path, function (entries, err) {
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

  function readPostBody(req, done) {
    var content = '';
    req.addListener('data', function (data) {
      content += data;
    });
    req.addListener('end', function () {
      if (content !== null) {
        done(content);
        content = null;
      }
    });
    setTimeout(function () {
      if (content !== null) {
        done(null, "too slow");
        content = null;
      }
    }, 1000);
  }

  /* room:
   * {
   *  name :
   *  desc :
   *  playlist : [
   *    { server:, id:, artist:, title:, album:, ...}
   *  ]
   * }
   */

  /*
  type:
  room: {name:, desc:}
  playlist: [ apath, apath, ... ]

  amo prvo expandat sve.
  */
  this.expandPlaylist = function (query, done) {
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
      done(expanded);
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
  };

  this.expandApi = function (server, input, onResult) {
    var url;
    if (servers[server] === undefined) {
      return onResult(null, null, "no such server");
    }
    url = servers[server].endpoint + "/expand/";
    request.post({uri: url, body: input}, function (e, response, body) {
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

  this.serve = function (wsock) {
    wsock.onMessageType("media", function (query) {
      if (query.type === "ls") {
        processLs(query, function (result, err) {
          if (err) {
            wsock.sendError(err);
          } else {
            wsock.sendType("media", result);
          }
        });
      } else {
        wsock.sendError("unknown media query type: " + query.type);
      }
    });
  };

  this.getChunks = function (server, id, done) {
    api(server, '/get_chunks/?id=', id, done);
  };

  this.handleRequest = function (req, res) {
    if (req.url !== '/hello/' || req.method !== 'POST') {
      return false;
    }
    function onError(err) {
      res.statusCode = 400;
      res.end(JSON.stringify({error:err}));
    }
    readPostBody(req, function (data) {
      var name;
      try {
        name = addServer(JSON.parse(data), remoteAddr(req));
        api(name, "/ls/?path=", "/", function (result, err) {
          if (!err) {
            res.statusCode = 200;
            res.end("i see you");
          } else {
            onError(err);
          }
        });
      } catch (err) {
        onError(err);
      }
    });
    return true;
  };

  (function () {
    purgeOldServers();
    loadServersFromConfig();
  }());

};
