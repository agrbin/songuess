/*jslint indent: 2, plusplus: true */
"use strict";

var app = {
  http: require('http'),
  config: require('./config.js'),
  url: require('url'),
  library: require('../library/library.js'),
  hello: require('./master_hello.js'),
  handlerNames: [ 'ls', 'expand', 'get_chunks', 'chunk', 'search' ],
  handlers: [],
  chunksTable: {}, // shared by get_chunks and chunk handlers
  initHandlers: function () {
    var
      i,
      handler;

    for (i = 0; i < this.handlerNames.length; ++i) {
      handler = require('./' + this.handlerNames[i]);
      if (handler.init) {
        handler.init(this);
      }
      this.handlers.push(handler);
    }
  },
  run: function () {
    var that = this;
    var reloadMediaTimer = null;

    function reloadMedia(firstSuccessCb) {
      that.library.loadLibrary(function (filesFound) {
        console.log(filesFound + ' files found in library');
        that.hello(filesFound);
        if (firstSuccessCb != null) {
          firstSuccessCb();
          firstSuccessCb = null;
        }
      });
      if (reloadMediaTimer == null) {
        reloadMediaTimer = setInterval(
            reloadMedia.bind(this, null),
            that.config.reloadLibraryIntervalS * 1e3);
      }
    }

    function startServer() {
      that.http.createServer(function (req, res) {
        var
          parsedUrl = that.url.parse(req.url, true),
          method = parsedUrl.pathname,
          params = parsedUrl.query,
          i;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');

        function sendError(msg) {
          var o = { error: msg };
          res.end(JSON.stringify(o));
        }

        for (i = 0; i < that.handlers.length; ++i) {
          if (that.handlers[i].canHandleMethod(method)) {
            that.handlers[i].handle(method, params, req, res, sendError);
            break;
          }
        }

        if (i === that.handlers.length) {
          sendError("unknown method");
        }
      }).listen(that.config.port);
      console.log('listening on: ' + that.config.port);
    }

    // Reload library.json and start server.
    // Note that this function will reload the library file repeatedly, but it
    // will invoke the callback only once.
    reloadMedia(startServer);
  }
};

app.initHandlers();
app.run();

