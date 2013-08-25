module.exports = function(exports) {

  exports.client.masterServer = "ws://songuess.jit.su/";
  exports.client.cookieStorage = "DummyStorage";

  exports.server.indexHtml = "index.min.html";
  exports.server.htdocsDir = null;
  exports.server.staticMaxAge = 3600;

  exports.streamer.sendAhead = 12;

  exports.media.servers = {
    'classical-media' : {
      fixed     : true,
      endpoint  : 'http://xfer.hr:8081',
      desc      : 'classical teacher'
    }
  };

  exports.proxy.throttleStreamOff = 3;
  exports.proxy.throttleStreamAmp = 3;
  exports.proxy.urlSuffix = '.jpg';
  exports.proxy.primaryHttpRoot = 'http://songuess.xfer.hr',
  exports.proxy.secondaryHttpRoot = 'http://songuess.jit.su';

};
