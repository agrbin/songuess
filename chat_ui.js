// instantied only when DOM is ready.
// user is current logged in user.
function ChatUI(chat, user) {

  var body, list, input, user;

  function initialize() {
    var it;
    debug("DOM sbodyman");
    body = $(".chat .right")[0];
    list = $(".chat .left")[0];
    input = $(".chat input")[0];
    $(input).focus();
    $(".chat form").submit(function () {
      if ($(input).val().length > 0) {
        chat.handleSend($(input).val());
        $(input).val("");
      }
      return false;
    });
    $("h1").css({
      color: pretty.colorStyle(user.id)
    });
  }

  function entry (type, what) {
    $("<div>")
      .addClass(type)
      .html(what)
      .appendTo(body);
    $(body)
      .scrollTop(body.scrollHeight);
  }

  this.clear = function () {
    $(body).empty();
  };

  this.updateList = function () {
    $(list).empty();
    for (it = 0; it < chat.getNumberOfClients(); ++it)
      $(list)
        .append(pretty.fullClient(chat.getClient(it)));
  };

  this.addNotice = function (what) {
    entry("sys",
      pretty.time(myClock.clock()) + " "
      + pretty.text(what));
  };

  this.userJoined = function (id, reason) {
    entry("sys",
      pretty.time(myClock.clock()) + " " +
      pretty.nameClient(chat.getClient(id))
      + " joined the room.");
  };

  this.userLeft = function (id, reason) {
    entry("sys",
      pretty.time(myClock.clock()) + " " +
      pretty.nameClient(chat.getClient(id))
      + " left: " + reason);
  };

  this.addMessage = function (msg) {
    entry("say",
      pretty.time(msg.when) + " " +
      (msg.from ?
        pretty.nameClient(chat.getClient(msg.from)) + ": "
        : "")
      + pretty.text(msg.what));
  };

  initialize();

}
