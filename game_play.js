/*jslint indent: 2, plusplus: true */
"use strict";

// u options na primjer idu uvjeti kad prihvacam tocan odgovor
module.exports = function (playlist, options) {
  var
    currentIndex = 0,
    randomOrder,
    playlistLength = playlist.length;

  (function () {
    var
      i,
      j,
      tmp;

    randomOrder = [];
    for (i = 0; i < playlistLength; ++i) {
      randomOrder.push(i);
    }
    for (i = 0; i < playlistLength; ++i) {
      j = Math.floor(Math.random() * playlistLength);

      tmp = randomOrder[i];
      randomOrder[i] = randomOrder[j];
      randomOrder[j] = tmp;
    }
  }());

  this.currentItem = function () {
    return playlist[randomOrder[currentIndex]];
  };

  this.currentId = function () {
    return this.currentItem().id;
  };

  this.nextId = function () {
    ++currentIndex;
    return this.currentId();
  };

  this.acceptableAnswer = function (answer) {
    return answer.toLowerCase() === this.currentItem().title.toLowerCase();
  };
};

