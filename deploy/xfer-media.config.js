module.exports = function (exports) {
  exports.port = 52067;
  exports.masterServer = 'https://songuess.xfer.hr';
  exports.media.name = 'seedbox-media';
  exports.media.owner = 'anton.grbin@gmail.com';
  exports.media.token = 'WILL_SET_TO_TRUST_THIS_IP';
  exports.media.acl = [
    ['allow', 'email', 'mosrecki@gmail.com'],
    ['allow_fix', 'email', 'mosrecki@gmail.com'],
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
    ['allow', 'email', 'brahle@gmail.com'],
    ['allow_fix', 'email', 'brahle@gmail.com'],
  ];
  exports.media.access_point.endpoint = 'http://localhost:52067';
};
