// fails everything.
function DummyStorage() {
  this.writeFile = function (file, data, done) {
    setTimeout(done, 0);
  };
  this.isFile = function (file, yes, no) {
    setTimeout(no, 0);
  };
  this.readFile = function (file, done) {
    setTimeout(done, 0);
  };
  this.killFile = function (file, done) {
    setTimeout(done, 0);
  };
};
