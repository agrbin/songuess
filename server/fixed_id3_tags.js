/*jslint indent: 2, plusplus: true*/
"use strict";

// https://docs.google.com/document/d/1pab0ac5WUMTSPDmiCnABVns7-if1DnllMFNZnto5Rro/edit#

var
  fixedTagsConfig = require('./config.js').fixed_tags,
  fs = require('fs');

exports.FixedID3Tags = function (media) {
  var fixtures = {},
    that = this,
    filename = fixedTagsConfig.storageFileName,
    defaultEncoding = {encoding: 'utf-8'};

  function flushToFile() {
    fs.writeFile(
        filename,
        JSON.stringify(fixtures, null, 2),
        defaultEncoding,
        function () { });
  }

  function readFromFile() {
    if (!fs.existsSync(filename)) {
      console.log(filename + " doesn't exists for fixed id3 tags.");
      return;
    }
    try {
      fixtures = JSON.parse(
        fs.readFileSync(filename, {encoding: 'utf-8'})
      );
      console.log(Object.keys(fixtures).length
          + " fixed titles read from " + filename);
    } catch (err) {
      console.log("FixedID3Tags: couldn't read storage", err);
    }
  }

  this.getFixtureKey = function (playlistItem) {
    return [playlistItem.server, playlistItem.id].join(":");
  }

  // clones and retruns a new playlistItem with possible fixes.
  this.getFixedItem = function (playlistItem) {
    if (!playlistItem) {
      console.log("playlistItem is funky: " + playlistItem);
      return playlistItem;
    }
    var key = this.getFixtureKey(playlistItem);
    if (fixtures.hasOwnProperty(key)) {
      return fixtures[key];
    }
    return playlistItem;
  };

  // Checks that item doesn't jump over an alternative title:
  // OK:
  // title
  // title2
  // title3
  // title4
  //
  // NOT OK:
  // title
  // title10
  this.validAltTitle = function (item) {
    var key;
    var alt_title_indices = [];
    for (key in item) {
      if (key === "title") {
        key = "title1";
      }
      if (key.substr(0, 5) === "title") {
        alt_title_indices.push(key.substr(5));
      }
    }
    alt_title_indices.sort();
    for (var i = 0; i < alt_title_indices.length; ++i) {
      if (alt_title_indices[i] != (i + 1).toString()) {
        return false;
      }
    }
    return true;
  };

  // Keeps only non-empty string values.
  this.sanitizeItem = function (item) {
    var key;
    var result = {};
    for (key in item) {
      if (typeof item[key] == 'string' && item[key].length > 0) {
        result[key] = item[key];
      }
    }
    return result;
  };

  // fixedItem must contain server: and id: (client has that info).
  this.fixItem = function (client, fixedItem) {
    if (!media.canUserFixTags(fixedItem.server, client.email())) {
      return false;
    }
    fixedItem["fixed_by_email"] = client.email();
    fixedItem["fixed_by_id"] = client.pid();
    fixedItem["fixed_ms"] = new Date().getTime();
    fixtures[that.getFixtureKey(fixedItem)] = fixedItem;
    console.log(fixedItem);
    flushToFile();
    return true;
  };

  readFromFile();
};

