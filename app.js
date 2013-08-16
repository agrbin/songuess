/*jslint indent: 2, plusplus: true*/
"use strict";

var ws = require('ws'),
  Streamer = require('./streamer.js').Streamer,
  Syncer = require('./syncer.js').Syncer,
  config = require('./config.js').server,
  verifyToken = require('./auth.js').verifyToken,
  Chat = require('./chat.js').Chat;

var httpServer = require('http').createServer();
var server = new ws.Server({server: httpServer});
var chat = new Chat();

function onVerified(sock, user) {
  var syncer = new Syncer(sock, function () {
    chat.connect(sock, user);
  });
}

server.on('connection', function (sock) {
  sock.onmessage = function (message) {
    verifyToken(message, function (user, err) {
      if (err) {
        sock.close(1000, err);
      } else {
        sock.send(JSON.stringify(user), function () {
          onVerified(sock, user);
        });
      }
    });
  };
});

httpServer.listen(config.port);
