var config = require("./config.js").media,
  request = require('request');

exports.MediaGateway = function () {

  var that = this,
    commandCallbacks = {};

  // function answerCallback(answer, err)
  this.query = function (query, answerCallback) {
    var cmd, params;
    if (!(query instanceof Array)) {
      return answerCallback(null, "query must be instance of array");
    }
    params = query;
    cmd = params.shift();
    if (cmd === "ls") {
      return processLs(params, answerCallback);
    }
    return answerCallback(null, "query unavailable");
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
          path : name + ":///",
          url : name + ":///",
          type : "server",
          desc : config[name].desc
        });
      }
    }
    return sol;
  };

  // server and path.
  function parsePath(path, done) {
    var it = path.indexOf("://");
    if (!it) {
      done(null, "ls invalid path");
      return;
    }
    return [path.substr(0, it), path.substr(it + 3)];
  }

  function processLs(params, done) {
    var path;
    if (params.length === 0) {
      return done(getMediaProviders()); 
    }
    if (params.length === 1) {
      path = parsePath(params[0], done); 
      if (path) {
        that.api(path[0], "/ls/?path=", path[1], function (entries, err) {
          if (err) {
            return done(null, err);
          }
          for (var i = 0; i < entries.length; ++i) {
            entries[i].url = path[0] + "://" + entries[i].path;
          }
          done(entries);
        });
      }
      return;
    }
    done(null, "unavailable!");
  }

};
