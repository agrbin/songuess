/*jslint indent: 2, plusplus: true*/
"use strict";

var
  ws = require('ws'),
  fs = require('fs'),
  config = require('./config.js').server,
  verifyToken = require('./auth.js').verifyToken,
  Syncer = require('./syncer.js').Syncer,
  SockWrapper = require('./sockwrap.js').SockWrapper;

var onHttpRequest,
  httpServer = require('http').createServer(onHttpRequest),
  media = new (require('./media.js').MediaGateway)(),
  proxy = new (require('./httpproxy.js').HttpProxy)(),
  chat = new (require('./chat.js').Chat)(media, proxy),
  server = new ws.Server({server: httpServer}),
  landingHtml = null;

function onHttpRequest(req, res) {
  if (proxy.handleRequest(req, res)) {
    return;
  }
  if (req.url === "/" && landingHtml !== null) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'max-age=3600');
    res.end(landingHtml);
  } else {
    res.statusCode = 404;
    res.end();
  }
}

function onVerified(sock, user) {
  var syncer = new Syncer(sock, function (ping) {
    var wsock = new SockWrapper(sock, ping);
    user.ping = ping;
    chat.connect(wsock, user);
    media.serve(wsock);
  });
}

server.on('connection', function (sock) {
  sock.onmessage = function (message) {
    verifyToken(message, function (user, err) {
      // it looks like reason should not be too long.
      if (err) {
        sock.close(1000, err.toString().substr(0, 100));
      } else {
        sock.send(JSON.stringify(user), function () {
          onVerified(sock, user);
        });
      }
    });
  };
});

if (config.landingHtml) {
  fs.readFile(config.landingHtml, function (err, data) {
    if (err) {
      console.log("while loading landing html: ", err);
    } else {
      console.log("landing html size: ", data.length);
      landingHtml = data;
    }
  });
}

httpServer.listen(config.port);
