/*jslint regexp: true, stupid: true, indent: 2, plusplus: true */
"use strict";

var
  fs = require('fs'),
  Id3 = require('id3'),
  execSync = require('execSync'),
  library = require('../library/library.js'),
  newFilesCount = 0,
  modifiedFilesCount = 0,
  totalFilesCount = 0,
  allFilesSet = {},
  needsRescan = [];

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
    entriesLength = entries.length,
    i = 0,
    entryPath,
    entryStat,
    results = [],
    regexp = /.*\.mp3/i;

  for (i = 0; i < entriesLength; ++i) {
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
    filesLength,
    i;

  for (p in library.filesById) {
    if (library.filesById.hasOwnProperty(p)) {
      if (allFilesSet.hasOwnProperty(p) === false) {
        files = fs.readdirSync('../chunks/' + p);
        filesLength = files.length;
        for (i = 0; i < filesLength; ++i) {
          fs.unlinkSync('../chunks/' + p + '/' + files[i]);
        }

        fs.rmdirSync('../chunks/' + p);

        ++result;
      }
    }
  }

  return result;
}

function rescan() {
  var
    needsRescanLength = needsRescan.length,
    i,
    file,
    shellResult,
    id3Data;

  for (i = 0; i < needsRescanLength; ++i) {
    file = needsRescan[i];

    console.log('resampling and chunkifying: "' + file.name + '"');
    shellResult = execSync.exec('./resample_and_chunkify.sh "' + file.fullPath + '"');
    file.numberOfChunks = parseInt(shellResult.stdout, 10);
    console.log('created ' + file.numberOfChunks + ' chunks');

    console.log('reading id3..');
    id3Data = new Id3(fs.readFileSync(file.fullPath));
    id3Data.parse();
    file.artist = id3Data.get('artist');
    file.album = id3Data.get('album');
    file.title = id3Data.get('title');
    file.length = Math.floor(file.numberOfChunks * 2.4);
    file.scannedTimestamp = (new Date()).getTime();
    delete file.fullPath;

    console.log(file);
    console.log('');
  }
}

console.log('loading library..');
library.loadLibrary(function (filesFound) {
  var newLibrary;

  console.log(filesFound + '\t\tfiles found in library\n');

  console.log('traversing folders..');
  newLibrary = walk('../mp3');

  console.log(totalFilesCount + '\t\tfiles found in mp3 folder');
  console.log(cleanRemoved() + '\t\tfiles were removed');
  console.log(newFilesCount + '\t\tfiles were added');
  console.log(modifiedFilesCount + '\t\tfiles were modified');
  console.log(needsRescan.length + '\t\tfiles need to be rescanned\n');

  rescan();

  console.log('done rescanning\n');
  console.log('saving library..');
  library.saveLibrary(newLibrary, function () {
    console.log('done!');
  });
});
