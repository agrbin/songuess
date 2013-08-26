#!/opt/local/bin/node
/*jslint regexp: true, stupid: true, indent: 2, plusplus: true */
"use strict";

var
  fs = require('fs'),
  Id3 = require('id3'),
  exec = require('child_process').exec,
  newFilesCount = 0,
  modifiedFilesCount = 0,
  totalFilesCount = 0,
  allFilesSet = {},
  needsRescan = [],
  calledAs = process.argv[1],
  dirname = calledAs.replace(/\/[^\/]*$/, ''),
  library = require(dirname + '/../library/library.js');

function checkFile(fullPath, name, stat) {
  var
    inode = stat.ino,
    modified = stat.mtime.getTime() / 1000,
    libFile = library.filesById[inode],
    file = {
      name: name,
      inode: inode
    },
    shouldRescan = false,
    p;

  allFilesSet[inode] = true;
  ++totalFilesCount;

  if (!libFile) {
    shouldRescan = true;
    ++newFilesCount;
  } else if (modified > libFile.scannedTimestamp) {
    shouldRescan = true;
    ++modifiedFilesCount;
  } else {
    for (p in libFile) {
      if (libFile.hasOwnProperty(p)) {
        file[p] = libFile[p];
      }
    }
    file.name = name;
  }

  if (shouldRescan) {
    file.fullPath = fullPath;
    needsRescan.push(file);
  }

  return file;
}

function walk(folderPath) {
  var
    entries = fs.readdirSync(folderPath),
    i = 0,
    entryPath,
    entryStat,
    results = [],
    regexp = /.*\.mp3/i;

  for (i = 0; i < entries.length; ++i) {
    entryPath = folderPath + '/' + entries[i];
    entryStat = fs.statSync(entryPath);

    if (entryStat.isDirectory()) {
      results.push({
        name: entries[i],
        children: walk(entryPath)
      });
    } else if (entryStat.isFile()) {
      if (regexp.test(entries[i])) {
        results.push(checkFile(entryPath, entries[i], entryStat));
      }
    }
  }

  return results;
}

function cleanRemoved() {
  var
    result = 0,
    p,
    files,
    i,
    chunksDir = dirname + '/../chunks/';

  for (p in library.filesById) {
    if (library.filesById.hasOwnProperty(p)) {
      if (allFilesSet.hasOwnProperty(p) === false) {
        files = fs.readdirSync(chunksDir + p);
        for (i = 0; i < files.length; ++i) {
          fs.unlinkSync(chunksDir + p + '/' + files[i]);
        }

        fs.rmdirSync(chunksDir + p);

        ++result;
      }
    }
  }

  return result;
}


function rescan(done) {
  var it = 0;

  function afterChunk(shellResult, file) {
    var id3Data;

    if (file !== undefined) {
      file.numberOfChunks = parseInt(shellResult, 10);
      console.log('created ' + file.numberOfChunks + ' chunks');
      console.log('reading id3..');
      id3Data = new Id3(fs.readFileSync(file.fullPath));
      id3Data.parse();
      file.artist = id3Data.get('artist');
      file.album = id3Data.get('album');
      file.title = id3Data.get('title');
      file.duration = Math.floor(file.numberOfChunks * 2.4);
      file.scannedTimestamp = (new Date()).getTime();
      delete file.fullPath;
      console.log(file);
      console.log('');
    }

    if (it < needsRescan.length) {
      file = needsRescan[it++];
      console.log('resampling and chunkifying: "' + file.name + '"');
      exec(
        dirname + '/resample_and_chunkify.sh "' + file.fullPath + '"',
        function (error, stdout, stderr) {
          if (stderr) {
            console.log(stderr);
          }
          if (error !== null) {
            console.log(error);
            console.log('');
            afterChunk();
          } else {
            afterChunk(stdout.toString(), file);
          }
        }
      );
    } else {
      done();
    }
  }

  afterChunk();
}

console.log('loading library..');
library.loadLibrary(function (filesFound) {
  var newLibrary;

  console.log(filesFound + '\t\tfiles found in library\n');

  console.log('traversing folders..');
  newLibrary = {
    name: '',
    children: walk(dirname + '/../mp3')
  };

  console.log(totalFilesCount + '\t\tfiles found in mp3 folder');
  console.log(cleanRemoved() + '\t\tfiles were removed');
  console.log(newFilesCount + '\t\tfiles were added');
  console.log(modifiedFilesCount + '\t\tfiles were modified');
  console.log(needsRescan.length + '\t\tfiles need to be rescanned\n');

  rescan(function() {
    console.log('done rescanning\n');
    console.log('saving library..');
    library.saveLibrary(newLibrary, function () {
      console.log('done!');
    });
  });
});
