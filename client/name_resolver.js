/*  NameResolver!
 *
 *  clear() -> clears everything
 *  add(id, name) -> adds (id, name) pair to structure
 *  remove(id) -> pops a di from structure
 *  display(id) -> generates distinguishable name for this acc
 *  whois(name_fragment) -> returns id of account with this name (or throws)
 *  whoisSilent(name_fragment) -> returns id of account with this name or null
 */
function NameResolver() {
  var
    that = this,
    nonAlphanum = /[^a-zA-Z0-9 ]/g,
    mulSpace = /  +/g,
    trimSpace = /^ | $/g,
    nameArrs = {}, // id -> nameArray (split by " ")
    normNameArrs = {}, // id -> nameArray normalize and split by " "
    displayMemo = {}; // display names

  function normalize(str) {
    str = str.toLowerCase();
    str = str.replace(/\./g, ' ');
    str = str.replace(nonAlphanum, '');
    str = str.replace(mulSpace, ' ');
    str = str.replace(trimSpace, '');
    return str;
  }

  // checks if arrays have exact same elements
  // (elements do not contain dots)
  function checkExact(arr1, arr2) {
    arr1.sort(); arr2.sort();
    return arr1.join('.') === arr2.join('.');
  }

  // check if there is a shared element in two arrays
  function checkAny(arr1, arr2) {
    var map = {}, it = 0;
    for (var it = 0; it < arr1.length; ++it) {
      map[arr1[it]] = 1;
    }
    for (var it = 0; it < arr2.length; ++it) {
      if (map[arr2[it]] === 1) {
        return true;
      }
    }
    return false;
  }

  function check(checkFunction, probe) {
    var id, sol, cnt = 0;
    for (id in normNameArrs) {
      if (checkFunction(normNameArrs[id], probe)) {
        sol = id; ++cnt;
      }
    }
    if (cnt === 1) {
      return sol;
    } else if (cnt > 1) {
      throw "multiple matches";
    }
    return null;
  }

  function partitiveSet(arr) {
    var x, y, sol = [], tmp;
    for (x = 1; x < (1 << Math.min(arr.length, 5)); ++x) {
      tmp = []; 
      for (y = 0; y < arr.length; ++y) {
        if (x & (1 << y)) {
          tmp.push(arr[y]);
        }
      }
      sol.push(tmp);
    }
    return sol;
  }

  function rebuildDisplay() {
    var id, sol, i, j, part_map = {}, part_arr, part, solution = {};
    for (id in nameArrs) {
      solution[id] = {};
      part_arr = partitiveSet(nameArrs[id]);
      for (j = 0; j < part_arr.length; ++j) {
        part = part_arr[j].join(" ");
        if (part_map.hasOwnProperty(part)) {
          delete solution[ part_map[part] ][part];
        } else {
          solution[id][part] = 1;
        }
        part_map[part] = id;
      }
    } 
    for (id in solution) {
      sol = false; j = 1e9;
      for (part in solution[id]) {
        if (part.length < j) {
          j = part.length; sol = part;
        }
      }
      displayMemo[id] = sol || nameArrs[id].join(" ");
    }
  }

  this.add = function (id, name) {
    if (nameArrs.hasOwnProperty(id)) {
      throw "this id is already in structure";
    }
    nameArrs[id] = name.split(" ");
    normNameArrs[id] = normalize(name).split(" ");
  };

  this.remove = function (id) {
    delete nameArrs[id];
    delete normNameArrs[id];
  };

  this.rebuildDisplay = rebuildDisplay;

  this.display = function (id) {
    return displayMemo[id];
  };

  // all dots will be converted to spaces
  this.whois = function (probe) {
    var it, sol,
      checkFunctions = [checkExact, checkAny];
    probe = normalize(probe).split(" ");
    for (it = 0; it < checkFunctions.length; ++it) {
      sol = check(checkFunctions[it], probe);
      if (sol !== null) {
        return sol;
      }
    }
    throw "no matches";
  };

  this.whoisSilent = function (name) {
    try {
      return that.resolve(name);
    } catch (err) {
      return null;
    }
  };

  this.clear = function () {
    displayMemo = {};
    normNameArrs = {};
    nameArrs = {};
    nameArray = {};
  };
}

