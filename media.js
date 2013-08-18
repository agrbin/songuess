var config = require("./config.js").media,
  request = require('request');

exports.MediaGateway = function () {

  var that = this;

  this.serve = function (wsock) {
    wsock.onMessageType("media", function (query) {
      if (query.type === "ls") {
        return processLs(query, function (result, err) {
          if (err) {
            wsock.sendError(err);
          } else {
            wsock.sendType("media", result);
          }
        });
      }
      wsock.sendError("unknown media query type: " + query.type);
    });
  };

  this.api = function (server, method, param, done) {
    var url;
    if (config[server] === undefined) {
      return done(null, "no such server");
    }
    url = config[server].endpoint + method;
    url += encodeURIComponent(param);
    request(url, function (e, response, body) {
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
    var server, path;

    if (!query.hasOwnProperty('apath')) {
      return done(null, "ls query has no apath field");
    }

    if (query.apath.length === 0) {
      return done(getMediaProviders()); 
    }

    server = query.apath[0];
    path = "/" + query.apath.slice(1).join("/");

    that.api(server, "/ls/?path=", path, function (entries, err) {
      if (err) {
        return done(null, err);
      }
      for (var i = 0; i < entries.length; ++i) {
        entries[i].apath = query.apath.concat(entries[i].name);
      }
      done(entries);
    });
  }

};
