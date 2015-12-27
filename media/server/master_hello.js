var config = require('./config.js'),
  request = require('request');

// this class will hello the master server with identification
// of this media server.
module.exports = function (numberOfFiles) {
  function log(what) {
    console.log("Hello: " + what);
  }

  function onResponse(e, res, body) {
    if (!e && res.statusCode === 200) {
      log(body);
    } else {
      if (e) log(e);
      if (res) log(res.statusCode);
      if (body) log(body);
      log("!! failed to authenticate with master server.");
    }
  }

  (function () {
    var url = config.masterServer + "/hello/", body;
    config.media.song_count = numberOfFiles;
    config.media.helloInterval = config.helloInterval;
    body = JSON.stringify(config.media);

    request.post(
      {url: url, timeout: 1500, body: body},
      onResponse
    );
  })();
};
