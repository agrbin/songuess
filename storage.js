/*
 * killFile = function(file, done);
 * isFile = function(file, yes, no);
 * writeFile = function(file, data, done);
 *
 * readFile = function(file, done);
 */
function Storage(onFatal) {

  var fs = null, requestFunction;
  var queue = [];
  var writeFile, readFile, isFile, killFile;

  if (!onFatal) onFatal = function() {
    console.log(arguments);
  };

  if (!(File && FileReader && FileList && Blob)) {
    onFatal("File APIs are not fully supported.");
  }

  requestFunction = window.webkitRequestFileSystem
                    || window.requestFileSystem;
  requestFunction(
    window.TEMPORARY,
    1024,
    initHandler,
    errorHandler
  );

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
        throw("Storage: " + errors[i], e);
  }

  function resolveQueue() {
    var i;
    for (i = 0; i < queue.length; ++i)
      queue[i][0](queue[i][1], queue[i][2], queue[i][3]);
  }

  this.writeFile = writeFile = function(file, data, done) {
    if (!fs) return queue.push([writeFile, file, data, done]);
    fs.root.getFile(file, {create: true}, function(fileEntry) {
      fileEntry.createWriter(function(fileWriter) {
        var blob = new Blob([data], {type: 'text/plain'});
        if (done) fileWriter.onwriteend = done;
        fileWriter.onerror = errorHandler;
        fileWriter.write(blob);
      }); 
    }, errorHandler);
  };

  this.isFile = isFile = function(file, yes, no) {
    if (!fs) return queue.push([isFile, file, yes, no]);
    fs.root.getFile(file, {create: false}, yes, function() {
      if(no) no();
    });
  };

  this.readFile = readFile = function(file, done) {
    if (!fs) return queue.push([readFile, file, done]);
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

  this.killFile = killFile = function(file, done) {
    if (!fs) return queue.push([killFile, file, done]);
    fs.root.getFile(file, {create: false}, function(fileEntry) {
      fileEntry.remove(function() {
        if(done) done();
      }, errorHandler);
    }, errorHandler);
  };

}
