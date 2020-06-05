// media_ui
function MediaUI(media) {

  var that = this;

  function initialize() {
    $(".media form").submit(function () {
      media.handleNewRoom({
        name : $("#name").val(),
        desc : $("#desc").val(),
        streamFromMiddle : $("#stream_from_middle").prop('checked')
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

  initialize();
}
