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
  staticServer = new (require('./static_server').Server)();

function onHttpRequest(req, res) {
  if (!proxy.handleRequest(req, res)) {
    if (!media.handleRequest(req, res)) {
      staticServer.handleRequest(req, res);
    }
  }
}

function onVerified(sock, user) {
  var syncer = new Syncer(sock, function (ping) {
    var wsock = new SockWrapper(sock, ping, user);
    user.ping = ping;
    chat.connect(wsock, user);
    media.serve(wsock, user);
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
      } else if (!chat.getRoomByName(roomName).desc.isHostRoom) {
        sock.send(JSON.stringify({
          type: 'attachToRoom',
          status: 'SERVER_ERROR',
          data: 'room is not a Host Room'
        })); 
      } else {
        console.log('room exists and is a host room');
        chat.getRoomByName(roomName).attachHostSocket(sock);
        sock.send(JSON.stringify({
          type: 'attachToRoom',
          status: 'OK'
        })); 
      }
    } else {
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
    }
  };
});

httpServer.listen(config.port);
