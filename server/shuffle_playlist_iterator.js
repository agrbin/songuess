/*jslint indent: 2, plusplus: true */
"use strict";

// u options na primjer idu uvjeti kad prihvacam tocan odgovor
module.exports = function (playlist, fixed_id3_tags) {
  var
    currentIndex = -1,
    randomOrder,
    playlistLength = playlist.length,
    memoLastItem = null;

  function randomize() {
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
  }

  this.lastItem = function () {
    if (memoLastItem) {
      return fixed_id3_tags.getFixedItem(memoLastItem);
    }
    return null;
  };

  this.currentItem = function () {
    if (currentIndex == -1) {
      return null;
    }
    return fixed_id3_tags.getFixedItem(
        playlist[randomOrder[currentIndex]]);
  };

  this.nextItem = function () {
    memoLastItem = this.currentItem();
    ++currentIndex;
    if (currentIndex === playlistLength) {
      randomize();
      currentIndex -= playlistLength;
    }
    return this.currentItem();
  };

  randomize();
};

