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
      chat.handleSend($(input).val());
      $(input).val("");
      return false;
    });
    $("h1").css({
      color: Pretty.colorStyle(user.id)
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

  this.updateList = function () {
    $(list).empty();
    for (it = 0; it < chat.getNumberOfClients(); ++it)
      $(list)
        .append(Pretty.fullClient(chat.getClient(it)));
  };

  this.addNotice = function (what) {
    entry("sys",
      Pretty.time(myClock.clock()) + " "
      + Pretty.text(what));
  };

  this.userJoined = function (id, reason) {
    entry("sys",
      Pretty.time(myClock.clock()) + " " +
      Pretty.nameClient(chat.getClient(id))
      + " joined the room.");
  };

  this.userLeft = function (id, reason) {
    entry("sys",
      Pretty.time(myClock.clock()) + " " +
      Pretty.nameClient(chat.getClient(id))
      + " left: " + reason);
  };

  this.addMessage = function (msg) {
    entry("say",
      Pretty.time(msg.when) + " " +
      (msg.from ?
        Pretty.nameClient(chat.getClient(msg.from)) + ": "
        : "")
      + Pretty.text(msg.what));
  };

  initialize();

}
