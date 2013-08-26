module.exports = function (c) {
  c.client.masterServer = "ws://songuess.jit.su/";
  c.server.port = 80;
  c.proxy.primaryHttpRoot = 'http://songuess.jit.su';
  c.client.cookieStorage = "DummyStorage";
  c.client.primaryChunkDownloadTimeout = 100000;
};
