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
  proxy = new (require('./httpproxy.js').HttpProxy)(),
  chat = new (require('./chat.js').Chat)(proxy),
  server = new ws.Server({server: httpServer}),
  staticServer = new (require('./static_server').Server)();

function onHttpRequest(req, res) {
  if (!proxy.handleRequest(req, res)) {
    staticServer.handleRequest(req, res);
  }
}

function onVerified(sock, user) {
  var syncer = new Syncer(sock, function (ping) {
    var wsock = new SockWrapper(sock, ping, user);
    user.ping = ping;
    chat.connect(wsock, user);
  });
}

server.on('connection', function (sock) {
  sock.onmessage = function (message) {
    var parsedMessage = JSON.parse(message.data);
    if (parsedMessage.type == 'attachToRoom') {
      var roomName = parsedMessage.data.roomName; 
      if (!chat.roomNameExists(roomName)) {
        sock.send(JSON.stringify({
          type: 'attachToRoom',
          status: 'SERVER_ERROR',
          data: 'room doesn\'t exist'
        })); 
      } else {
        chat.getRoomByName(roomName).attachHostSocket(sock);
        sock.send(JSON.stringify({
          type: 'attachToRoom',
          status: 'OK'
        })); 
      }
    } else {
      verifyToken(message, function (user, err) {
        if (err) {
          // It looks like the reason should not be too long.
          sock.close(1000, err.toString().substr(0, 100));
        } else {
          sock.send(JSON.stringify(user), function () {
            onVerified(sock, user);
          });
        }
      });
    }
  };
});

httpServer.listen(config.port);
