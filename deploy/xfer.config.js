module.exports = function(exports) {

  exports.client.masterServer = "wss://songuess.xfer.hr/ws/";
  exports.client.cookieStorage = "DummyStorage";

  exports.server.indexHtml = "index.min.html";
  exports.server.htdocsDir = null;
  exports.server.staticMaxAge = 3600;
  exports.server.port = 52066

  exports.streamer.sendAhead = 12;
  exports.socket.ignoreNetworkProblems = true;
  exports.socket.pingInterval = 15;

  exports.media.trustServers = {
    // it seems that media server on vseedbox talks with master server using this IP address.
    '::ffff:10.0.0.1' : true,
    '10.0.0.48' : true
  };

  exports.media.servers = {};
  exports.media.timeout = 5;
  exports.sync.maxClockDeviation = 50;

  exports.proxy.throttleStreamOff = 3;
  exports.proxy.throttleStreamAmp = 3;
  exports.proxy.urlSuffix = '.jpg';
  exports.proxy.primaryHttpRoot = 'https://songuess-cf-cache.xfer.hr';
  exports.proxy.secondaryHttpRoot = 'https://songuess.xfer.hr';

  exports.fixed_tags.storageFileName = '/srv/songuess/fixed_tags.json';
};
