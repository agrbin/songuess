// instantied only when DOM is ready.
// user is current logged in user.
function ChatUI(chat, user) {

  var
    body, 
    users_list, 
    input, 
    user,
    announceTimer,
    that = this;

  function entry (type, html, when) {
    var t0 = chat.getRoomState().songStart, what;
    when = when || myClock.clock();
    state = chat.getRoomState().state;
    if (state === "dead") {
      what = pretty.delimit("#");
    } else if (type.indexOf("cmd") !== -1) {
      what = pretty.delimit(">");
    } else if (type.indexOf("err") !== -1) {
      what = pretty.delimit("!");
    } else if (type.indexOf("relative") !== -1) {
      what = pretty.playTime(when - t0);
    } else if (state === "suspense") {
      what = pretty.delimit();
    } else {
      what = pretty.delimit("|");
    }
    what = what + " " + html;
    $("<div>")
      .addClass("entry")
      .addClass(type)
      .html(what)
      .appendTo(body);
    $(body)
      .scrollTop(body.scrollHeight);
  }

  function songOffset() {
    if (chat.getRoomState().state === "playing") {
      return myClock.clock() - chat.getRoomState().songStart;
    } else {
      return null;
    }
  }

  this.clear = function () {
    $(body).empty();
  };

  this.youEntered = function (data) {
    var playlist = data.desc.playlist;
    entry("sys cmd", "You entered " + data.desc.name
                 + " (" + data.desc.desc + ").");
    if (playlist.length) {
      entry("sys cmd", "Playlist has " + playlist.length + " song"
                   + (playlist.length > 1 ? "s." : "."));
      if (chat.getRoomState().state === "playing") {
        entry("sys", 
          " Current song is @ "
          + pretty.timeInterval(songOffset()) + "s.");
      }
    }
  };

  this.userJoined = function (id, reason) {
    entry("sys cmd",
      pretty.client(chat.getClient(id))
      + " joined the room.");
  };

  this.userLeft = function (id, reason) {
    entry("sys cmd",
      pretty.client(chat.getClient(id))
      + " left: " + reason);
  };

  this.calledNext = function (desc) {
    entry("sys wrong",
      " The song was " +
      pretty.song(desc.answer) + ". " +
      pretty.client(chat.getClient(desc.who)) +
      " called for a next one :/");
  };

  this.honored = function (desc) {
    entry("sys correct",
      pretty.client(chat.getClient(desc.from)) +
      " honored his point to " +
      pretty.client(chat.getClient(desc.to)) +
         "!");
    that.updateList();
  };

  this.displayInfo = function (song) {
    entry("sys cmd", " hmmm, You ask last song what was?");
    entry("sys cmd", " artist: " + pretty.text(song.artist, "bold"));
    entry("sys cmd", " album : " + pretty.text(song.album, "bold"));
    entry("sys cmd", " title : " + pretty.text(song.title, "bold"));
  };

  this.correctAnswer = function (desc) {
    var client = chat.getClient(desc.who);
    entry("sys correct",
      " Well done " + pretty.client(client) +
      "! The song was " + pretty.song(desc.answer) + ".");
    this.updateList();
  };

  this.calledReset = function (desc) {
    entry("sys cmd", " " +
      pretty.client(chat.getClient(desc.who)) +
      " /reset his score.");
    this.updateList();
  };

  this.songEnded = function (desc) {
    entry("sys wrong", " No one got this one - " +
      pretty.song(desc.answer));
  };

  this.announceSong = function (when) {
    entry("sys", "");
    entry("sys relative", " Get ready!"); // poseban
  };

  this.addMessage = function (msg) {
    var cl = [], state = chat.getRoomState().state;
    if (state === "playing" || state === "after") {
      cl.push("relative");
    }
    cl.push(msg.from === null ? "sys" : "say");
    entry(cl.join(" "),
      (msg.from ?
        pretty.client(chat.getClient(msg.from)) + ": "
        : "")
      + pretty.text(msg.what));
  };

  this.gotToken = function (token) {
    entry("sys", " You can use: " + pretty.text(token));
  };

  this.addNotice = function (what, cls) {
    entry("sys " + cls, what);
  };

  (function () {
    var it;
    body = $(".chat .left")[0];
    input = $(".chat input")[0];
    $(".chat form").submit(function () {
      if ($(input).val().length > 0) {
        chat.handleSend($(input).val());
        $(input).val("");
      }
      return false;
    });
    $("h1").hide();
    $(".layout.chat").show();
    $(".chat .col").click(function () {
      $(input).focus();
    });
    $(input).focus();
    $(window)
      .on('hashchange', function() {
        chat.triggerCommand("/join " + location.hash);
      })
      .on('resize', function() {
        $(body)
          .scrollTop(body.scrollHeight);
      });

    users_list = new UsersList(chat, $(".chat .right"));
    that.updateList = users_list.updateList;
  }());

}
