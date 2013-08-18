// media_ui
function MediaUI(media) {

  var input, left, right;

  function initialize() {
    $(".layout.chat").hide();
    $(".layout.media").show();
    left = $(".media .left")[0];
    right = $(".media .right")[0];
    input = $(".media input")[0];
    $(input).focus();
    $(".media form").submit(function () {
      media.handleTextQuery(
        $(input).val()
      );
      return false;
    });
  }

  this.populateLeft = function (list, apath) {
    var it, map = {
      "server" : srvEntry,
      "directory" : dirEntry,
      "file"   : fileEntry
    };
    $(left).empty().append(parentDir(apath));
    for (it = 0; it < list.length; ++it) {
      $(left).append(
        map[list[it].type](it, list[it])
      );
    }
  };

  this.setInput = function (what) {
    $(input).val(what);
  };

  function handleLsClick(path) {
    media.handleTextQuery("ls " + path);
  }

  function aPath(one) {
    var url = media.arrayToPath(one.apath);
    if (one.type === 'file') {
      return $("<a>")
        .attr('title', url)
        .text(one.name);
    }
    return $("<a>")
      .attr('href', '#')
      .attr('title', media.arrayToPath(one.apath))
      .text(one.name)
      .click(function (e) {
        e.preventDefault();
        handleLsClick(url);
      });
  }

  function parentDir(apath) {
    if (apath.length) {
      apath = apath.slice(0, -1);
      return $("<div>")
        .addClass("entry")
        .append($("<div>").addClass("num").text("-"))
        .append(aPath({apath: apath, name : ".."}));
    }
  }

  function fileEntry(num, one) {
    return $("<div>")
      .addClass("entry")
      .append($("<div>").addClass("num").text(num))
      .append(aPath(one));
  }

  function dirEntry(num, one) {
    return $("<div>")
      .addClass("entry")
      .append($("<div>").addClass("num").text(num))
      .append(aPath(one))
      .append($("<div>").addClass("desc").text(one.count));
  }

  function srvEntry(num, one) {
    return $("<div>")
      .addClass("entry")
      .append($("<div>").addClass("num").text(num))
      .append(aPath(one))
      .append($("<div>").addClass("desc").text(one.desc));
  }

  initialize();

}
