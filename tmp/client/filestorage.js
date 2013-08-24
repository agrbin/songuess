/*
 * killFile = function(file, done);
 * isFile = function(file, yes, no);
 * writeFile = function(file, data, done);
 *
 * readFile = function(file, done);
 */
function FileStorage(onFatal) {

  var that = this,
    fs = null,
    queue = [];

  function initialize() {
    var requestFunction = window.webkitRequestFileSystem
                      || window.requestFileSystem;
    if (!(File && FileReader && FileList && Blob && requestFunction)) {
      return onFatal("FileStorage is not supported.");
    }
    requestFunction(
      window.TEMPORARY,
      1024,
      initHandler,
      errorHandler
    );
  }

  function initHandler(_fs) {
    fs = _fs;
    resolveQueue();
  }

  function errorHandler(e) {
    var i, errors = [
      'QUOTA_EXCEEDED_ERR',
      'NOT_FOUND_ERR',
      'SECURITY_ERR',
      'INVALID_MODIFICATION_ERR',
      'INVALID_STATE_ERR'
    ];
    for (i = 0; i < errors.length; ++i)
      if (e.code == FileError[errors[i]])
        return onFatal("Storage: " + errors[i], e);
  }

  function resolveQueue() {
    var i;
    for (i = 0; i < queue.length; ++i)
      queue[i][0](queue[i][1], queue[i][2], queue[i][3]);
  }

  this.writeFile = function(file, data, done) {
    if (!fs) return queue.push([that.writeFile, file, data, done]);

    fs.root.getFile(file, {create: true}, function(fileEntry) {
      fileEntry.createWriter(function(fileWriter) {
        var blob = new Blob([data], {type: 'text/plain'});
        if (done) fileWriter.onwriteend = done;
        fileWriter.onerror = errorHandler;
        fileWriter.write(blob);
      }); 
    }, errorHandler);
  };

  this.isFile = function(file, yes, no) {
    if (!fs) return queue.push([that.isFile, file, yes, no]);
    fs.root.getFile(file, {create: false}, yes, function() {
      if(no) no();
    });
  };

  this.readFile = function(file, done) {
    if (!fs) return queue.push([that.readFile, file, done]);
    fs.root.getFile(file, {create: false}, function(fileEntry) {
      fileEntry.file(function(file) {
         var reader = new FileReader();
         reader.onloadend = function(e) {
           done(this.result);
         };
         reader.readAsText(file);
      }, errorHandler);
    }, errorHandler);
  };

  this.killFile = function(file, done) {
    if (!fs) return queue.push([that.killFile, file, done]);
    fs.root.getFile(file, {create: false}, function(fileEntry) {
      fileEntry.remove(function() {
        if(done) done();
      }, errorHandler);
    }, errorHandler);
  };

  initialize();

}
