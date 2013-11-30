/**
 * client has id, this is how we recognize them.
 * needs to be able to send message to one client.
 * needs to be able to get a list of all clients.
 *
 * getClients() returns object with ids as keys
 * sendBeep({id:, when:, freq:, duration:}) sends a message to
 *  that client.
 * sendSkew({id:, offset:})
 *
 *
 * server sends to clients two new message types
 *  sbeep {when:, freq:, duration:}
 *  sskew {offset:}
 * server receives from master new message type:
 *  sbeep {to:, when:, freq:, duration:}
 *  sskew {to:, offset:}
 * 
 *
 */
function SonicSyncer(clock, audioContext, getClients, sendBeep, sendSkew, log) {
  // time for the first client to make a sound
  // after master sends requests.
  var OFFSET = 1000;
  var INTERVAL = 500;
  var BEEP_FREQ = 18000;
  var BEEP_DURATION = 100;
  var BORDER_LINE = 5;
  var NUM_REQS = 2;
  var CONVERGE_FACTOR = 1.5;

  var lastChunkFromNow = 0;
  var listener = new Listener(audioContext);
  listener.setFrequency(BEEP_FREQ);
  log("sonic syncer invoked");

  var n = 0, clients = {}, requests = [];

  function initIteration() {
    n = 0;
    clients = getClients();
    for (var id in clients) {
      ++n;
    }
    log("room has " + n + " clients for ssync.");
  }

  function buildRequest() {
    requests = [];
    var now = clock();
    for (var id in clients) {
      for (var j = 0; j < NUM_REQS; ++j) {
        requests.push({
            id: id,
            when: now + OFFSET,
            freq: BEEP_FREQ
        });
        now += INTERVAL;
      }
    }
    lastChunkFromNow = INTERVAL + now - clock();
  }

  function handleBeep() {
    var t = clock();
    var minDist = 1e6, whichOne = null, whichIt = null;
    for (it = 0; it < requests.length; ++it) {
      var dist = Math.abs(requests[it].when - t);
      if (dist < minDist) {
        minDist = dist;
        whichOne = requests[it].id;
        whichIt = it;
      }
    }
    if (whichOne) {
      log("got you " + whichOne);
      requests[whichIt].heard = t;
    }
  }

  // return must be average without outliers
  function statistics(deltas) {
    return deltas.reduce(function(a,b){return a+b;})
      / deltas.length;
  }

  function analyzeResults() {
    // log("stopped");
    listener.stop();
    var ready = true, haveHeard = false, deltas = {};
    // initialize deltas to 0
    for (var id in clients) {
      deltas[id] = [];
    }
    // collect deltas
    for (var it = 0; it < requests.length; ++it) {
      var id = requests[it].id;
      if ('heard' in requests[it]) {
        var delta = requests[it].heard - requests[it].whenPretend;
        if (Math.abs(delta) < INTERVAL) {
          deltas[id].push(delta);
        }
      }
    }
    // do penalites and statistics
    for (var id in clients) {
      if (deltas[id].length > 0) {
        var avg = statistics(deltas[id]);
        log(id + " skew for " + Math.floor(avg));
        sendSkew({
          to:id,
          offset:-Math.floor(avg) / CONVERGE_FACTOR
        });
      }
    }
  }

  function sendRequests() {
    for (var it = 0; it < requests.length; ++it) {
      log("sending beep request to " + requests[it].id);
      sendBeep({
        to: requests[it].id,
        when: requests[it].when,
        freq: requests[it].freq,
        duration: BEEP_DURATION,
      });
    }
  }

  function doIteration() {
    initIteration();
    buildRequest();
    listener.onBeep(handleBeep, INTERVAL / 2);
    sendRequests();
    setTimeout(analyzeResults, lastChunkFromNow);
  }

  doIteration();

}
