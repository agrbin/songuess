module.exports = function(exports) {

  exports.client.masterServer = "ws://songuess.xfer.hr:52066/";
  exports.client.cookieStorage = "DummyStorage";

  exports.server.indexHtml = "index.min.html";
  exports.server.htdocsDir = null;
  exports.server.staticMaxAge = 3600;
  exports.server.port = 52066

  exports.streamer.sendAhead = 12;
  exports.socket.ignoreNetworkProblems = true;

  exports.media.trustServers = {
    '91.121.68.92' : true // xfer.hr
  };

  exports.media.servers = {};
  exports.media.timeout = 5;

  exports.proxy.throttleStreamOff = 3;
  exports.proxy.throttleStreamAmp = 3;
  exports.proxy.urlSuffix = '.jpg';
  exports.proxy.primaryHttpRoot = 'http://songuess.anton-grbin.from.hr',
  exports.proxy.secondaryHttpRoot = 'http://songuess.xfer.hr';

};
