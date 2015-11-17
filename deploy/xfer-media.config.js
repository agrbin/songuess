module.exports = function (exports) {
  exports.port = 52067;
  exports.masterServer = 'http://songuess.xfer.hr:52066';
  exports.media.name = 'seedbox-media';
  exports.media.owner = 'anton.grbin@gmail.com';
  exports.media.token = 'WILL_SET_TO_TRUST_THIS_IP';
  exports.media.acl = [
    ['allow', 'email', 'anton.grbin@gmail.com'],
    ['allow', 'email', 'tomislav.grbin@gmail.com'],
    ['allow', 'email', 'doroteja.gudlek@gmail.com'],
    ['allow', 'email', 'tomislav.gudlek@gmail.com'],
    ['allow', 'email', 'tgudlek@gmail.com'],
    ['allow_fix', 'email', 'anton.grbin@gmail.com'],
    ['allow_fix', 'email', 'tomislav.grbin@gmail.com'],
    ['allow_fix', 'email', 'doroteja.gudlek@gmail.com'],
    ['allow_fix', 'email', 'tomislav.gudlek@gmail.com'],
    ['allow_fix', 'email', 'tgudlek@gmail.com'],
  ];
  exports.media.access_point.endpoint = 'http://songuess.xfer.hr:52067';
};
