/*jslint indent: 2, plusplus: true*/
'use strict';

var currentEnv = process.env.NODE_ENV || 'developement';

exports.server = {
  // where to listen.
  port  : 8080,

  // this file will be served when server
  // is hit with GET / .. or null
  indexHtml : '../client/index.html',

  // if htdocsDir is set, master will serve files from that dir to http
  // clients. content-types are set only for html, js and css
  htdocsDir : '../client/',

  // if set, this field will be sent with static files as 'Cache-Control:
  // max-age='
  // or null not to send that header.
  staticMaxAge : null,

  // when set to true static file will be re-read for every request.
  // this option should not be used on production. this option will turn
  // off previous option (caching).
  readFileOnRequest : true
};

exports.socket = {
  // ping will be sent  every pingInterval seconds to client
  // to keep the connection alive across non patient firewalls.
  pingInterval : 60,

  // this will turn of clock skew checks and sleepyPeriod checks
  ignoreNetworkProblems : false,

  // if socket notices sleepyPeriod seconds without user activity, that user
  // will get disconnected.
  sleepyPeriod : 30 * 60
};

exports.streamer = {
  // server and client have synced clocks. if chunk is to be played less than
  // sendAhead seconds in the future, dispatch process for that chunk will begin
  sendAhead     : 8,

  // every setTimeout-ed checkInterval seconds streamer will check above
  // condition. note that if proxy is available this time will be cutted for
  // proxy.throttleStream random noise.
  checkInterval : 0.5,

  // chunkDuration is chunk duration! it is copied to lib/frames.cpp.
  chunkDuration : 2.448,

  // overlapping between chunks to make seamless playback on
  // client. this constant is copied to ../client/player.js
  overlapTime   : 0.048,
};

exports.sync = {
  // number of sync request sent to client
  numberOfSamples   : 10,

  // from every request clock offset is caluclated. after all samples are sent,
  // if offset standard deviation is larger than this value, process is
  // restarted.
  maxClockDeviation : 10,

  // if client has ping larger than this value, it can't play.
  maxPing           : 1000
};

exports.media = {
  // can log?
  log : true,

  // seconds to wait before media server will be flagged as unavailable.
  timeout : 2,

  // when media server stays silent for this amount of time
  // kick him off. must be greater than helloInterval on media.
  timeToPurge : 120,

  // these media servers will not have to have valid token
  trustServers : {
    '127.0.0.1' : true
  },

  // list servers.
  servers : {
    /*
    'local-media' : {
      endpoint  : 'http://localhost:8081',
      desc      : 'default media server'
    }
    */
  }

};

exports.auth = {
  clientID    :  '975171789069.apps.googleusercontent.com',
  verifyURL   :  'https://www.googleapis.com/oauth2/v1/tokeninfo',
  profileURL  :  'https://www.googleapis.com/oauth2/v1/userinfo',
  scope       :  [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
};

// this JSON will be returned by static server on /config.js.
exports.client = {
  // nodejs master server
  masterServer : "ws://localhost:8080/",

  // can be DummyStorage, or FileStorage
  cookieStorage : "FileStorage",

  // for each chunk client gets primary and secondary URL.
  // client should download primary URL and only
  // if this timeout passes, secondary URL is queried.
  primaryChunkDownloadTimeout : 1500,

  // copied values from server config to client config
  authClientID : exports.auth.clientID,
  authScope : exports.auth.scope,
  overlapTime : exports.streamer.overlapTime
};

exports.proxy = {
  // you can bypass proxy with this.
  enable  : true,

  // time period before proxy sends out the stream.
  // it is used to warm-up cache.
  // throttle delay will be calculated:
  //   delay = Off + (rand() * 2 - 1) * Amp
  throttleStreamOff : 2,
  throttleStreamAmp : 2,

  // where will proxy serve chunks
  urlPrefix : '/c/',

  // you can add extension to a chunk
  urlSuffix : '',

  // maximum number of seconds for media server to
  // send a chunk. after this we will issue 504 gateway
  // timeout to clients requesting that chunk.
  maxDelay : 1,

  // time that the URL returned from proxify will be available.
  maxAge : 60,

  // primary url sent to clients
  // if this timeout's secondary url will be queried
  primaryHttpRoot : 'http://localhost:8080',

  // secondary url or null.
  secondaryHttpRoot : null

};

// try and figure out how to use override.
if (require('fs').existsSync('./config.override.js')) {
  require('./config.override.js')(exports);
}
