// media_ui
function MediaUI(media) {

  var that = this, input, left, right;

  function initialize() {
    left = $(".media .left")[0];
    right = $(".media .right")[0];
    input = $(".media #cmd");
    $(input).hide();
    $(".media form").submit(function () {
      media.handleNewRoom({
        name : $("#name").val(),
        desc : $("#desc").val(),
        streamFromMiddle : $("#stream_from_middle").prop('checked'),
        isHostRoom: $("#create_host_room").prop('checked')
      });
      return false;
    });
    $(document).keydown(function (e) {
      if (e.keyCode == 27) {
        that.hideDialog();
      }
    });
    $(window).on('hashchange', function() {
      that.hideDialog();
    });
  }

  this.showDialog = function (name) {
    $(".layout.chat").hide();
    $(".layout.media").show();
    $("#name").val(name);
    $("#desc").val("").focus();
  }

  this.hideDialog = function () {
    $(".layout.media").hide();
    // this is not in our district, but we will
    // do it :)
    $(".layout.chat").show();
    $(".layout.chat input").focus();
  }

  function addMediaHelp() {
    return $("<div>")
      .addClass("entry")
      .append($("<div>").addClass("num").html("&nbsp;"))
      .append(
        "No media here! ",
        $("<a>")
          .attr('href', 'https://github.com/agrbin/songuess/wiki/Add-media')
          .text('How to add media to songuess.')
      );
  }

  this.populateLeft = function (list, apath) {
    var it, map = {
      "server" : srvEntry,
      "directory" : dirEntry,
      "file"   : fileEntry
    };
    $(left).empty().append(parentDir(apath));
    for (it = 0; it < list.length; ++it) {
      list[it].url = media.apathToUrl(list[it].apath);
      $(left).append(
        map[list[it].type](list[it])
      );
    }
    if (!apath.length && !list.length) {
      $(left).append(addMediaHelp());
    }
    disableSelect();
  };

  this.setInput = function (what) {
    $(input).val(what);
  };

  this.updatePlaylist = function (playlist) {
    var url;
    $(right).empty();
    for (url in playlist) {
      if (playlist.hasOwnProperty(url)) {
        $(right).append(playlistEntry(playlist[url]));
      }
    }
    disableSelect();
  };

  function disableSelect() {
    $('.clickable').mousedown(function(e) {e.preventDefault();});
  }

  function handleLsClick(path) {
    media.handleTextQuery("ls " + path);
  }

  function aPath(one) {
    if (one.type === 'file') {
      return $("<a>")
        .attr('title', one.url)
        .text(one.name);
    }
    return $("<a>")
      .attr('href', '#')
      .attr('title', media.apathToUrl(one.apath))
      .text(one.name)
      .click(function (e) {
        e.preventDefault();
        handleLsClick(one.url);
      });
  }

  function numDiv(one) {
    return $("<div>")
      .addClass("num")
      .hover(
        function() {$(this).parent().addClass("hover");},
        function() {$(this).parent().removeClass("hover");}
      )
      .attr("title", "add to playlist")
      .addClass("clickable")
      .click(function (e) {
        e.preventDefault();
        media.addToPlaylist(one);
      })
      .append($("<span>").text("add"));
  };

  function deleteDiv(one) {
    return $("<div>")
      .addClass("num")
      .addClass("clickable")
      .hover(
        function() {$(this).parent().addClass("hover");},
        function() {$(this).parent().removeClass("hover");}
      )
      .click(function (e) {
        e.preventDefault();
        media.removeFromPlaylist(one.url);
      })
      .append(
        $("<span>")
          .text("del")
          .attr('title', "remove from playlist")
      );
  };

  function parentDir(apath) {
    if (apath.length) {
      apath = apath.slice(0, -1);
      return $("<div>")
        .addClass("entry")
        .append($("<div>").addClass("num").html("&nbsp;"))
        .append(aPath({
          url: media.apathToUrl(apath),
          apath: apath,
          name : ".."}));
    } else {
      return $("<div>")
        .addClass("entry")
        .append($("<div>").addClass("num").html("&nbsp;"))
        .append(aPath({
          url: media.apathToUrl(apath),
          apath: apath,
          name : "[refresh]"}));
    }
  }

  function playlistEntry(one) {
    if (one.count === undefined) {
      one.count = 1;
    }
    return $("<div>")
      .addClass("entry")
      .append(deleteDiv(one))
      .append($("<a>")
              .text(one.name)
              .attr('title', one.url)
             )
      .append($("<div>").addClass("desc").text(one.count));
  }

  function fileEntry(one) {
    return $("<div>")
      .addClass("entry")
      .append(numDiv(one))
      .append(aPath(one));
  }

  function dirEntry(one) {
    return $("<div>")
      .addClass("entry")
      .append(numDiv(one))
      .append(aPath(one))
      .append($("<div>").addClass("desc").text(one.count));
  }

  function srvEntry(one) {
    return $("<div>")
      .addClass("entry")
      .append($("<div>").addClass("num").html("&nbsp;"))
      .append(aPath(one))
      .append($("<div>").addClass("desc").text(one.desc));
  }

  initialize();

}
