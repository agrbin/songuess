/*jslint indent: 2, plusplus: true*/
"use strict";

module.exports = function (options) {
  var
    MISTAKES_BY_CHAR = 1.0/6, // on 6 chars you may mistype one.
    nonAlphanum = /[^a-zA-Z0-9šđčćžáàâäãæéèêëíîïóôöœúùûüñç ]/g,
    mulSpace = /  +/g,
    trimSpace = /^ | $/g,
    trimParentheses = /\([^)]*\)/g,
    trimSquare = /\[[^\]]*\]/g,
    trimHashtag = /\#([^ ]+)/g,
    replacePairs = [
      ['ć', 'c'],
      ['č', 'c'],
      ['ç', 'c'],
      ['š', 's'],
      ['đ', 'dj'],
      ['ž', 'z'],
      ['á', 'a'],
      ['à', 'a'],
      ['â', 'a'],
      ['ä', 'a'],
      ['ã', 'a'],
      ['æ', 'ae'],
      ['é', 'e'],
      ['è', 'e'],
      ['ê', 'e'],
      ['ë', 'e'],
      ['í', 'i'],
      ['î', 'i'],
      ['ï', 'i'],
      ['ó', 'o'],
      ['ô', 'o'],
      ['ö', 'o'],
      ['œ', 'oe'],
      ['ú', 'u'],
      ['ù', 'u'],
      ['û', 'u'],
      ['ü', 'u'],
      ['ñ', 'n'],
    ];

  // O(n^2) hopefuly.
  function editDistance(a, b) {
    var i, j, matrix = [];
    if(a.length == 0) return b.length;
    if(b.length == 0) return a.length;

    // increment along the first column of each row
    for(i = 0; i <= b.length; i++){
      matrix[i] = [i];
    }

    // increment each column in the first row
    for(j = 0; j <= a.length; j++){
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for(i = 1; i <= b.length; i++){
      for(j = 1; j <= a.length; j++){
        if(b.charAt(i-1) == a.charAt(j-1)){
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                  Math.min(matrix[i][j-1] + 1, // insertion
                                           matrix[i-1][j] + 1)); // deletion
        }
        if (i > 1 && j > 1 && a.charAt(j-2) == b.charAt(i-1) && a.charAt(j-1) == b.charAt(i-2)) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i-2][j-2] + 1); // swap
        }
      }
    }

    return matrix[b.length][a.length];
  }

  // editDistance(t1, t2) >= editDistanceUnderEstimate(t1, t2)
  // O(1)
  function editDistanceUnderEstimate(t1, t2) {
    return Math.abs(t1.length - t2.length);
  }

  // O(n)
  function editDistanceUnderEstimate2(t1, t2) {
    var chars = {}, it, sol = 0;
    for (it = 0; it < t1.length; chars[t1[it++]] = 0);
    for (it = 0; it < t2.length; chars[t2[it++]] = 0);
    for (it = 0; it < t1.length; ++chars[t1[it++]]);
    for (it = 0; it < t2.length; --chars[t2[it++]]);
    for (it in chars)
      sol += Math.abs(chars[it]);
    return Math.round(sol / 2);
  }

  // this function returns a string.
  //
  // If remove_parenthesis_content is true:
  //  'anton (test)' => 'anton'
  //
  // If remove_parenthesis_content is false:
  // 'anton (test)' => 'anton test'
  function normalize(str, remove_parenthesis_content) {
    var i;
    if (str === null || str === undefined) {
      return "null";
    }
    str = str.toString();
    str = str.toLowerCase();
    str = str.replace(trimHashtag, '');
    if (remove_parenthesis_content) {
      str = str.replace(trimParentheses, '');
      str = str.replace(trimSquare, '');
    }
    str = str.replace(nonAlphanum, ' ');
    str = str.replace(mulSpace, ' ');
    str = str.replace(trimSpace, '');
    for (i = 0; i < replacePairs.length; ++i) {
      // regexp used so all occurences are replaced
      str = str.replace(new RegExp(replacePairs[i][0], 'g'), replacePairs[i][1]);
    }
    return str;
  }

  function checkTitleImpl(correct_title, answer, remove_parenthesis_content) {
    var t1 = normalize(answer, remove_parenthesis_content);
    var t2 = normalize(correct_title, remove_parenthesis_content);
    var allowed_mistakes = Math.floor(t1.length * MISTAKES_BY_CHAR);

    if (t1 === t2) return true;
    if (editDistanceUnderEstimate2(t1, t2) > allowed_mistakes) return false;
    if (editDistanceUnderEstimate(t1, t2) > allowed_mistakes) return false;
    if (editDistance(t1, t2) > allowed_mistakes) return false;
    return true;
  }

  function checkTitle(correct_title, answer) {
    // TODO(ganton): optimization idea, i can omit one call to this function if
    // neither of the strings contains '()[]'.
    return checkTitleImpl(correct_title, answer, true) ||
      checkTitleImpl(correct_title, answer, false);
  }

  function consumePrefixOrFalse(big, small) {
    if (big.substr(0, small.length).toLowerCase() === small.toLowerCase()) {
      return big.substr(small.length);
    }
    return false;
  }

  // Always returns a string.
  function maybeStripArtist(title, artist) {
    if (!artist) {
      return title;
    }
    artist = String(artist)
    // The song '22' by Taylor Swift for some reason had the Number type as a
    // title..
    title = String(title)
    return consumePrefixOrFalse(title, artist + " -") ||
      consumePrefixOrFalse(title, artist + " _") ||
      consumePrefixOrFalse(title, artist + " /") ||
      title;
  }

  // playlistItem is dictionary with 'title', 'title2', ... as a member.
  // answer is a string.
  this.checkAnswer = function (playlistItem, answer) {
    if (playlistItem === undefined) {
      return false;
    }
    var key, artist = playlistItem["artist"];
    // figure out if there is artis
    for (key in playlistItem) {
      // If key has 'title' as a prefix.
      if (key.substr(0, 5) === "title") {
        if (checkTitle(maybeStripArtist(playlistItem[key], artist), answer)) {
          return true;
        }
      }
    }
    return false;
  };
};
