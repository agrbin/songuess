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
    if (type.indexOf("cmd") !== -1) {
      what = pretty.delimit(">");
    } else if (type.indexOf("err") !== -1) {
      what = pretty.delimit("!");
    } else if (state === "dead") {
      what = pretty.delimit("|");
    } else if (t0 && type.indexOf("relative") !== -1) {
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
    entry("sys", "You entered " + data.desc.name
                 + " (" + data.desc.desc + ").");
    if (data.desc.name === "#root") {
      entry("sys", "Type /help for help.");
    }
    if (playlist.length) {
      entry("sys", "Playlist has " + playlist.length + " song"
                   + (playlist.length > 1 ? "s." : "."));
      if (chat.getRoomState().state === "playing") {
        entry("sys", 
          " Current song is @ "
          + pretty.timeInterval(songOffset()) + "s.");
      }
    }
  };

  this.userJoined = function (id, reason) {
    entry("sys",
      pretty.clientFullName(chat.getClient(id))
      + " joined the room.");
  };

  this.userLeft = function (id, reason) {
    entry("sys",
      pretty.client(chat.getClient(id))
      + " left: " + reason);
  };

  this.calledNext = function (desc) {
    if (desc.hasOwnProperty('answer')) {
      entry("sys", pretty.client(chat.getClient(desc.who)) + " calls /next.");
      entry("sys wrong",
            " The song was " + pretty.song(desc.answer) + ".");
    } else {
      entry("sys", pretty.client(chat.getClient(desc.who)) + " calls /next.");
    }
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
    entry("sys", " hmmm, You ask last song what was?");
    entry("sys", " artist: " + pretty.text(song.artist, "bold"));
    entry("sys", " album : " + pretty.text(song.album, "bold"));
    entry("sys", " title : " + pretty.text(song.title, "bold"));
  };

  this.displayPlaylist = function (playlist) {
    var it, arr;
    if (playlist.length) {
      entry("sys", " Playlist contains:");
    } else {
      return entry("sys", " This room has no songs.");
    }
    for (it = 0; it < playlist.content.length; ++it) {
      arr = playlist.content[it];
      entry("sys", arr[1] + " song" + (arr[1] > 1 ? "s" : "")
            + " from " + pretty.text(arr[0][1], "bold")
            + " by " + pretty.text(arr[0][0], "bold") + ".");
    }
    entry("sys", "enjoy!");
  };

  this.displayRow = function (desc) {
    if (chat.getNumberOfPersons() <= 1) {
      return;
    }
    if (desc.row % 5 === 0) {
      chat.getPlayer().rowSound(desc.row);
      entry("sys correct",
        pretty.client(chat.getClient(desc.who)) + " is " +
        pretty.rowMessage(desc.row));
    }
  };

  this.correctAnswer = function (desc) {
    var client = chat.getClient(desc.who);
    entry("sys correct",
      " Well done " + pretty.client(client) +
      "! The song was " + pretty.song(desc.answer) + ".");
    this.updateList();
  };

  this.calledReset = function (desc) {
    entry("sys", " " +
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
      + pretty.text(msg.what), msg.when);
  };

  this.displayWho = function (data) {
    var name, display;
    entry("sys", "You asked hmhmhm, who is where?");
    for (name in data) {
      if (data.hasOwnProperty(name)) {
        for (display in data[name]) {
          if (data[name].hasOwnProperty(display)) {
            entry("sys",
                  display + " is in " + name +
                  " with score " + data[name][display] + ".");
          }
        }
      }
    }
  };

  this.gotToken = function (token) {
    entry("sys", " You can use: " + pretty.text(token));
  };

  this.addNotice = function (what, cls) {
    entry("sys " + cls, what);
  };

  function prepareInputElement() {
    var lastInput = '';
    $(".chat form").submit(function () {
      if ($(input).val().length > 0) {
        chat.handleSend($(input).val());
        lastInput = $(input).val();
        $(input).val("");
      }
      return false;
    });
    $(input).on('keydown', function (evt) {
      if (evt.keyCode === 38) {
        var that = this;
        this.value = lastInput;
        setTimeout(function() {
          that.setSelectionRange(lastInput.length, lastInput.length);
        }, 0);
      }
      if (evt.keyCode === 40) {
        this.value = '';
      }
    });
  }

  (function () {
    var it;
    body = $(".chat .left")[0];
    input = $(".chat input")[0];
    prepareInputElement();
    $("h1").hide();
    $(".layout.chat").show();
    $(input).focus();
    $(window)
      .on('hashchange', function() {
        chat.triggerCommand("/join " + location.hash);
      })
      .on('resize', function() {
        $(body)
          .scrollTop(body.scrollHeight);
      });

    users_list = new GroupedUsersList(chat, $(".chat .right"));
    that.updateList = users_list.updateList;
  }());

}
