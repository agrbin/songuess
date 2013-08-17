// fails everything.
function DummyStorage() {
  this.writeFile = function (file, data, done) {
    done();
  };
  this.isFile = function (file, yes, no) {
    no();
  };
  this.readFile = function (file, done) {
    done(null);
  };
  this.killFile = function (file, done) {
    done();
  };
};
