// port to listen on
exports.port = 8081;

// URL where the chunks will be served
// in future, chunks can be served by another web server
exports.chunkBaseURL = '/chunk/';

// onto what master server we will publish media
exports.masterServer = 'http://localhost:8080';

// every reloadLibraryIntervalS seconds we will reload the library json file
// and send the master server current identification of this media server.
exports.reloadLibraryIntervalS = 60;

// this datum will be used to identify ourselfs with master server
exports.media = {

  // name of this media server
  name : 'default-media',

  // google email of owner of this media server.
  // won't be displayed to other users.
  owner : 'your.email@gmail.com',

  // write a short description.
  desc : 'default media server',

  // connect to masterServer in browser and issue
  // '/token' command. paste that token here.
  token : '',

  // how will master contact this media server
  access_point : {
    // endpoint URL where the REST API is served
    // if this endpoint is null, then master server will
    // take our IP address from hello query and append
    // listen_port on it to create URL
    endpoint : null,

    // this need not to be exports.port if we are
    // port-forwarding this port behind the router
    listen_port : exports.port
  },

  // who can create room with songs from this server?
  // currently only 'allow' and 'email' rules are implemented
  // 'allow_fix' is email of an user who can submit fixes for ID3 tags.
  acl : [
    ['allow', 'email', 'your.email@gmail.com']
  ]
};

// try and figure out how to use override.
if (require('fs').existsSync('./config.override.js')) {
  require('./config.override.js')(exports);
}
