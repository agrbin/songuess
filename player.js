/*
 * Player class is responsible for scheduling and playing chunks of music
 * received from the server.
 *
 * Public interface is:
 *
 * (constructor)(getTime, volumeElement)
 *  getTime is function which returns a clock (see addChunk bellow)
 *  volumeElement is input range element for adjusting the volume.
 *
 * addChunk(msg)
 *  msg is socket message event. it will be typed as ArrayBuffer and it will
 *  consist of two parts. first one is mp3 encoded audio. last 13 bytes is an
 *  ASCII string representing the starting point in time (getTime() time)
 *  for received chunk. difference in starting times for two sequential chunks
 *  will be exactly the duration of one chunk. this duration is integral when
 *  represented in milliseconds. 
 *  the audioContext hardware clock and getTime() clock are synced only once,
 *  and because of that the scheduling is not affected by imprecise JavaScript
 *  clock.
 *  one can think of the time part in last 13 bytes as a sequential number of the
 *  chunk.
 */
var Player = function(getTime, volumeElement) {

  var that = this
    , audioContext = new webkitAudioContext()
    , masterGain = null
    , timeOffset = null
    , warmUpCalled = false
    ; 

  // this is called only once to get the AudioContext started and to set up
  // master volume meter.
  // function will play a test note.
  (function() {
    if (warmUpCalled) return;
    else warmUpCalled = true;
    // set up master gain
    masterGain = audioContext.createGainNode();
    masterGain.connect(audioContext.destination);
    // volumeElement can be null.
    if (volumeElement) {
      volumeElement.style.display = 'block';
      volumeElement.addEventListener('change', function () {
        masterGain.gain.value = this.value;
      });
    }
    // play the number of the beast freq as a test note.
    // oscillator is a long word, isn't it?
    var oscillator = audioContext.createOscillator();
    oscillator.frequency.value = 666;
    oscillator.connect(masterGain);
    oscillator.noteOn(0);
    oscillator.noteOff(0.2);
  })();

  // socket.onmessage will be binded to this method.
  // when message is received, start downloading mp3 chunk and decode it.
  this.addChunk = function(chunkInfo, secondary) {
    var request = new XMLHttpRequest(), done = false;

    // we have timeout only on primary URL
    request.open(
        'GET',
        secondary ? chunkInfo.backupUrl : chunkInfo.url
    );
    request.responseType = 'arraybuffer';

    // after timeout query the backupUrl only if:
    //  this is primary query
    //  primary query is not finished
    //  we have backup url
    setTimeout(function () {
      if (!secondary && !done && chunkInfo.backupUrl) {
        console.log("using backup URL for chunk.");
        request.abort();
        return that.addChunk(chunkInfo, true);
      }
    }, window.songuess.primaryChunkDownloadTimeout);

    // register onload.
    request.addEventListener('load', function(evt) {
      done = true;
      if (evt.target.status != 200) return;
      audioContext.decodeAudioData(
        evt.target.response,
        function(decoded) {
          schedule(decoded, chunkInfo.start);
        }
      );
    }, false);

    request.send();
  };

  // transponseTime transponses server time to the audioContext's time.
  // it will return -1 if audioContext is not ready yet.
  //
  // timeOffset is calculated only once because we want audioContext's time to
  // be in charge for scheduling completely. myClock is used only for
  // synchronization with server.
  // audioContext.currentTime is sleeping on zero for some time so we must
  // check this explicitly. 
  function transponseTime(srvTime) {
    if (timeOffset === null && audioContext.currentTime > 0) {
      timeOffset = (getTime() / 1000) - audioContext.currentTime;
    }
    if (timeOffset !== null) {
      return (srvTime / 1000) - timeOffset;
    } else {
      return -1;
    }
  }

  // to avoid 'click' sound between the chunks we did some overlaping of chunks
  // on the server side. in the first overlapTime of the chunk we are doing
  // fade in, and the fade out is done on the end.
  // as a result we have cross-fade effect.
  // server is configured for the overlaping time of 48ms, eg. 2 mp3 frames on
  // 48khz sampling.
  function schedule(buffer, srvTime) {
    var source = audioContext.createBufferSource()
      , gainNode = audioContext.createGainNode()
      , duration = buffer.duration
      , overlapTime = 0.048
      , startTime = transponseTime(srvTime)
      , currentTime = audioContext.currentTime;

    // connect the components
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(masterGain);
    // to avoid click! fade in and out
    gainNode.gain.linearRampToValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(1, startTime + overlapTime);
    gainNode.gain.linearRampToValueAtTime(1, startTime + duration -overlapTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    // play the chunk if it is in the future
    // log the issues.
    if (startTime > currentTime) {
      if (startTime - currentTime < 1) {
        console.log("chunk almost late: ", startTime - currentTime);
      }
      source.noteOn(startTime);
    } else if (startTime + duration > currentTime) {
      console.log("chunk played with offset. late for: ", currentTime - startTime);
      source.start(currentTime, currentTime - startTime);
    } else {
      console.log("chunk ignored. late for: ", currentTime - startTime);
    }
  }

};

