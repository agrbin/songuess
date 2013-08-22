/*jslint indent: 2, plusplus: true*/
"use strict";

var
  ws = require('ws'),
  config = require('./config.js').server,
  verifyToken = require('./auth.js').verifyToken,
  Syncer = require('./syncer.js').Syncer,
  SockWrapper = require('./sockwrap.js').SockWrapper;

var httpServer = require('http').createServer(onHttpRequest);
var media = new (require('./media.js').MediaGateway)();
var proxy = new (require('./httpproxy.js').HttpProxy)();
var chat = new (require('./chat.js').Chat)(media, proxy);
var server = new ws.Server({server: httpServer});

function onHttpRequest(req, res) {
  if (!proxy.handleRequest(req, res)) {
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

httpServer.listen(config.port);
