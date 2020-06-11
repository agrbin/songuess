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
 */
var Player = function(getTime, volumeElement, onFatal) {

  var that = this
    , audioContext = null
    , masterGain = null
    , playPauseGain = null
    , sonicBeepGain = null
    , oscillator = null
    , playEnabled = true
    , timeOffset = null
    , overlapTime = window.songuess.overlapTime
    , warmUpCalled = false
    , muted = false
    , maxScheduledPoint = 0
    , streamEnabled = true
    , downloadDurationStat = {n: 0, sum: 0, avg:null}
    , hostAudioArray = []
    , firstHostChunkStartTime = null
    , currentHostChunkGain = null
    , nextSongStart = null
    , scheduledChunkEndTime = null;

  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
  }
  catch(e) {
    return onFatal('Web Audio API is not supported in this browser');
  }


  // this is called only once to get the AudioContext started and to set up
  // master volume meter.
  // function will play a test note.
  function playWarmUpNote() {
    if (warmUpCalled) return;
    else warmUpCalled = true;
    // set up master gain
    masterGain = audioContext.createGain();
    sonicBeepGain = audioContext.createGain();
    playPauseGain = audioContext.createGain();
    // initial volume is 0.5
    masterGain.gain.value = 0.5;
    masterGain.connect(playPauseGain);
    playPauseGain.connect(audioContext.destination);
    playPauseGain.gain.setValueAtTime(1, 0);
    sonicBeepGain.connect(audioContext.destination);
    // duration of first test beep.
    sonicBeepGain.gain.setValueAtTime(0.3, 0);
    sonicBeepGain.gain.setValueAtTime(0, 0.2);
    // volumeElement can be null.
    if (volumeElement) {
      volumeElement.style.display = 'block';
      volumeElement.addEventListener('change', function () {
        masterGain.gain.value = this.value;
      });
    }
    // play the number of the beast freq as a test note.
    oscillator = audioContext.createOscillator();
    oscillator.frequency.value = 666;
    oscillator.connect(sonicBeepGain);
    oscillator.start(0);
  }

  this.getAudioContext = function() {
    return audioContext;
  };

  /**
   * when and duration in ms.
   */
  this.sonicBeep = function(when, freq, duration) {
    var avoidClick = 0.002, g = sonicBeepGain;
    when = transponseTime(when);
    // set the freq
    oscillator.frequency.setValueAtTime(freq, when);
    g.gain.linearRampToValueAtTime(0, when - avoidClick/2);
    g.gain.linearRampToValueAtTime(1, when + avoidClick/2);
    when += duration / 1000;
    g.gain.linearRampToValueAtTime(1, when - avoidClick/2);
    g.gain.linearRampToValueAtTime(0, when + avoidClick/2);
  }

  // this will work only for future scheduled chunks.
  // it will mute everything that is already scheduled to avoid double play.
  this.resync = function (muteIt) {
    if (muteIt) {
      this.pause();
      setTimeout(
        this.play,
        1000 * Math.max(0, maxScheduledPoint - audioContext.currentTime)
      );
    }
    maxScheduledPoint = 0;
    timeOffset = null;
  };

  this.getMuted = function () {
    if (!warmUpCalled) return;
    return muted;
  };

  // toggles mute volume
  this.toggleMute = function () {
    if (!warmUpCalled) return;
    muted = !muted;
    if (muted) {
      masterGain.disconnect();
    } else {
      masterGain.connect(playPauseGain);
    }
    return muted;
  };

  this.toggleStream = function () {
    streamEnabled = !streamEnabled;
    return streamEnabled;
  };

  // disables and enables playback.
  this.pause = function () {
    console.log('pause called');

    if (!warmUpCalled) return;
    if (!playEnabled) return;
    playEnabled = false;
    // Go to zero over ~3 seconds, starting 1 second from now.
    playPauseGain.gain.setTargetAtTime(0, audioContext.currentTime + 1, 1);
  };

  this.setNextSongStart = function (songStart) {
    nextSongStart = songStart;  
  };

  this.play = function () {
    console.log('play called');

    if (!warmUpCalled) return;
    if (playEnabled) return;
    playEnabled = true;
    playPauseGain.gain.cancelScheduledValues(0);
    playPauseGain.gain.value = 1;
  };

  // returns if volume is muted currently
  this.setVolume = function (value) {
    if (!warmUpCalled) return;
    if (value === undefined) {
      return Math.round(masterGain.gain.value * 100) / 10;
    }
    if (value < 0 || value > 10) {
      throw "value must be in [0, 10]";
    }
    masterGain.gain.value = value / 10;
    return that.setVolume();
  };

  // The audio comes from a MediaRecorder object living inside the Chrome
  // extension.
  // The first chunk it sends contains a header.
  // The followup chunks should be concatenated with the previous ones,
  // otherwise the decodeAudioData call would fail.
  // The received 'chunk' is a Blob object.
  this.addHostChunk = function(chunk) {
    console.log('got host chunk:', chunk);

    // Just an optimization, no need to decode if we don't know when to
    // schedule.
    if (!firstHostChunkAlreadyScheduled() && nextSongStart === null) {
      console.log('skipping decode, first chunk schedule time unknown');
      return;
    }

    chunk.arrayBuffer().then(function(buffer) {
      // Concatenating type arrays (like Uint8Array) or ArrayBuffers is ugly,
      // so hostAudioArray is a normal Array object.
      hostAudioArray = hostAudioArray.concat(Array.from(new Uint8Array(buffer)));

      audioContext.decodeAudioData(
        new Uint8Array(hostAudioArray).buffer,
        function(audioBuffer) {
          scheduleHostChunk(audioBuffer);
        },
        function (e) {
          console.log('error decoding buffer:', e);
        }
      );
    });
  };

  // After this is called, the next chunk received should be the first chunk
  // of the next song.
  this.clearHostChunks = function() {
    console.log('clearing host chunks');
    hostAudioArray = [];
    if (currentHostChunkGain !== null && scheduledChunkEndTime !== null) {
      // The value will be 1e-5 at the given time, with exponential approach.
      // Note that 0 is not allowed as a param for this function, so we pass a small
      // number instead.
      currentHostChunkGain.gain.exponentialRampToValueAtTime(1e-5, scheduledChunkEndTime);
    }
    currentHostChunkGain = null;
  };

  // transponseTime transponses server time to the audioContext's time.
  // it will return -1 if audioContext is not ready yet.
  //
  // timeOffset is calculated only once because we want audioContext's time to
  // be in charge for scheduling completely. myClock is used only for
  // synchronization with server.
  // audioContext.currentTime is sleeping on zero for some time so we must
  // check this explicitly. 
  function transponseTime(serverTime) {
    if (timeOffset === null && audioContext.currentTime > 0) {
      timeOffset = (getTime() / 1000) - audioContext.currentTime;
    }
    if (timeOffset !== null) {
      return (serverTime / 1000) - timeOffset;
    } else {
      return null;
    }
  }

  function firstHostChunkAlreadyScheduled() {
    return (currentHostChunkGain !== null);
  }

  function scheduleHostChunk(audioBuffer) {
    console.log('scheduling buffer: ', audioBuffer, nextSongStart);

    // The function we call checks a variable that's modified inside this
    // current function, so it's important to store the initial value.
    const firstChunkScheduled = firstHostChunkAlreadyScheduled();

    // We don't know when to schedule the first chunk, nothing to do.
    if (!firstChunkScheduled && nextSongStart === null) {
      console.log('SHOULD NEVER HAPPEN');
      return;
    }

    const acTime = audioContext.currentTime;

    if (firstChunkScheduled) {
      if (acTime < firstHostChunkStartTime) {
        // It's possible we'd try to use a negative offset, this means the 2nd
        // chunk arrived but the 1st didn't start playing yet.
        // We'd try scheduling the 2nd one in the future, i.e. using a negative
        // offset.
        // It is OK just to not do anything in this case.
        console.log('attempted to schedule a chunk with negative offset');
        return;
      }
      console.log('muting previous chunk');
      // Mute the currently playing chunk, the new one will replace it
      // immediately.
      currentHostChunkGain.gain.value = 0;
    }

    var bufferSource = audioContext.createBufferSource();
    currentHostChunkGain = audioContext.createGain();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(currentHostChunkGain);
    currentHostChunkGain.connect(masterGain);

    if (!firstChunkScheduled) {
      // Schedule the first chunk, at the server given 'nextSongStart' but
      // translated to our current audioContext time.
      firstHostChunkStartTime = transponseTime(nextSongStart);

      console.log('scheduling first chunk at:', firstHostChunkStartTime);
      if (firstHostChunkStartTime < 0) {
        // This case is possible when a client joins after the song has been
        // playing for a while.
        // bufferSource.start complains in this case, so we start at 0 and use
        // an appropriate offset instead.
        bufferSource.start(0, -firstHostChunkStartTime);
      } else {
        bufferSource.start(firstHostChunkStartTime);
      }

      // This variable is only relevant until the first chunk is scheduled.
      nextSongStart = null;
    } else {
      // Offset by how much was already played.
      bufferSource.start(0, acTime - firstHostChunkStartTime);
      console.log('scheduling chunk at: ', acTime,
                  ' and offset: ', acTime - firstHostChunkStartTime);
    }

    scheduledChunkEndTime = firstHostChunkStartTime + audioBuffer.duration;
    var end = new Date(new Date().getTime() + (scheduledChunkEndTime - acTime)*1000);
    console.log('scheduled end time:', end.toLocaleTimeString(), end.getMilliseconds());
  }

  (function() {
    if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
      document.addEventListener('touchstart', playWarmUpNote);
      window.addEventListener('pageshow', function() {
        that.resync(true);
      });
    } else {
      playWarmUpNote();
    }
  })();

};

