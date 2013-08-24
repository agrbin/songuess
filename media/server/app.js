/*jslint indent: 2, plusplus: true */
"use strict";

var app = {
  http: require('http'),
  PORT: require('./config.js').port,
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

    this.library.loadLibrary(function (filesFound) {
      console.log(filesFound + ' files found in library');
      console.log('listening on: ' + that.PORT);
      that.hello(filesFound);

      that.http.createServer(function (req, res) {
        var
          parsedUrl = that.url.parse(req.url, true),
          method = parsedUrl.pathname,
          params = parsedUrl.query,
          i;

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');

        /*
        console.log('method: ' + method);
        console.log('params: ' + JSON.stringify(params));
        console.log('');
        */

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
      }).listen(that.PORT);
    });
  }
};

app.initHandlers();
app.run();

