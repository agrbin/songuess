// media_ui
function MediaUI(media) {

  var input, left, right;

  this.takeOver = function () {
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
      $(input).val("");
      return false;
    });
  };

  this.populateLeft = function (list) {
    var it, map = {
      "server" : srvEntry,
      "directory" : dirEntry,
      "file"   : fileEntry
    };
    $(left).empty().append(parentDir());
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
    var text = one.url;
    if (one.type !== 'server') {
      text = text.split("/").slice(-1)[0];
    }
    if (one.type === 'file') {
      return $("<a>")
        .attr('title', one.url)
        .text(text);
    }
    return $("<a>")
      .attr('href', '#')
      .attr('title', one.url)
      .text(text)
      .click(function (e) {
        e.preventDefault();
        handleLsClick(one.url);
      });
  }

  function parentDir() {
    var url = $(input).val();
    if (url.substr(-2) === "//") {
      url = "ls";
    } else {
      url = url.split("/").slice(0, -1).join("/");
      if (url.substr(-2) === "//") {
        url += "/";
      }
    }
    url = url.split(" ").slice(1).join(" ");
    // i will just kill my self with shotgun now.
    return $("<div>")
      .addClass("entry")
      .append($("<div>").addClass("num").text("-"))
      .append(
        $("<a>")
          .attr('href', '#')
          .attr('title', 'parent dir')
          .text('..')
          .click(function (e) {
            e.preventDefault();
            handleLsClick(url);
          })
      );
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
  };

}
