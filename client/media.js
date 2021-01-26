function Media(wsock, onFatal) {

  var that = this,
    ui = new MediaUI(this),
    onFinish;

  this.newRoomDialog = function (name, pOnFinish) {
    onFinish = pOnFinish;
    ui.showDialog(name);
  };

  this.handleNewRoom = function (room) {
    wsock.sendType("create_room", {
      room : room
    });
    wsock.onMessage("create_room", function (data) {
      if (data === true) {
        ui.hideDialog();
        onFinish(room.name);
      } else {
        onFatal("unknown error while creating room.");
      }
    });
  };
}
