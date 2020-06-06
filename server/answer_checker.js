/*jslint indent: 2, plusplus: true*/
"use strict";

module.exports = function (options) {
  var
    MISTAKES_BY_CHAR = 1.0/6, // on 6 chars you may mistype one.
    nonAlphanum = /[^a-zA-Z0-9šđčćžžáàâäãæéèêëíîïóôöœúùûüñç ]/g,
    mulSpace = /  +/g,
    trimSpace = /^ | $/g,
    trimHashtag = /\#([^ ]+)/g,
    replacePairs = [
      ['ć', 'c'],
      ['č', 'c'],
      ['ç', 'c'],
      ['š', 's'],
      ['đ', 'dj'],
      ['ž', 'z'],
      ['ž', 'z'],
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

  // O(n^2) hopefully.
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

  // Returns a string containing only alpha-num characters, no spaces, no
  // parenthesis, etc...
  function normalize(str) {
    var i;
    if (str === null || str === undefined) {
      return "null";
    }
    str = str.toString();
    str = str.toLowerCase();
    str = str.replace(trimHashtag, '');
    str = str.replace(nonAlphanum, ' ');
    str = str.replace(mulSpace, ' ');
    str = str.replace(trimSpace, '');
    for (i = 0; i < replacePairs.length; ++i) {
      // regexp used so all occurences are replaced
      str = str.replace(new RegExp(replacePairs[i][0], 'g'), replacePairs[i][1]);
    }
    return str;
  }

  // This function will generate possible answer options, for example by
  // removing different parenthesis pairs or by stripping "the" from the title.
  //
  // The returned strings have all been through the normalize() function above.
  function generateCorrectAnswers(correct_title) {
    const normalized = normalize(correct_title);
    let answers = [normalized];

    // Strip the and add to versions.
    if (normalized.startsWith('the ')) {
      answers.push(normalized.substring(4));
    }

    // Example where this is needed is the title 'dark horse feat juicy j'.
    // 'feat ..' parts are usually inside parenthesis, but not in this case.
    const feat_pos = normalized.indexOf(' feat ');
    if (feat_pos > 0) {
      answers.push(normalized.substring(0, feat_pos));
    }

    // Finds ( or [, and then includes everything until the matching ) or ].
    // Doesn't work for nested brackets, but we didn't see cases like that
    // so far.
    let parenthesesRegex = /[\(\[][^\)\]]*[\)\]]/g;
    let match;
    while ((match = parenthesesRegex.exec(correct_title)) != null) {
      let withoutGroup = correct_title.substring(0, match.index)
                       + correct_title.substring(parenthesesRegex.lastIndex);
      answers = answers.concat(generateCorrectAnswers(withoutGroup));

      // In cases like "everybody (backstreet's back)", we want to accept
      // "backtreet's back" as well.
      // But we don't want to accept things like (feat X) or (live).
      let groupOnly = correct_title.substring(
        match.index + 1,
        parenthesesRegex.lastIndex - 1
      ).toLowerCase();
      if (!groupOnly.includes('feat') &&
          !groupOnly.includes('live') &&
          !groupOnly.includes('version')) {
        answers = answers.concat(generateCorrectAnswers(groupOnly));
      }
    }

    return answers;
  }

  function compareNormalizedStrings(s1, s2) {
    if (s1 === s2) return true;

    // If the title has a lot of optional stuff in parenthesis, the typed
    // accepted answer might be short.
    // In this case, using the longer title would allow for a lot of mistakes
    // in the shorter one.
    // So we use the 'min' instead of 'max' here instead.
    const allowed_mistakes = Math.floor(
      Math.min(s1.length, s2.length) * MISTAKES_BY_CHAR
    );

    if (editDistanceUnderEstimate2(s1, s2) > allowed_mistakes) return false;
    if (editDistance(s1, s2) > allowed_mistakes) return false;
    return true;
  }

  function checkTitle(correct_title, answer) {
    const normalized_answer = normalize(answer);
    for (const correct_answer of generateCorrectAnswers(correct_title)) {
      if (compareNormalizedStrings(normalized_answer, correct_answer)) {
        return true;
      }
    }
    return false;
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
    // figure out if there is an artist
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
