var fs = require('fs'),
    id3 = require('id3');

function walk(folderPath) {
  var entries = fs.readdirSync(folderPath),
      entriesLength = entries.length,
      i = 0,
      entryPath = undefined,
      entryStat = undefined,
      results = [];

  for (i = 0; i < entriesLength; ++i) {
    entryPath = folderPath + '/' + entries[i];
    entryStat = fs.statSync(entryPath); 

    if (entryStat.isDirectory()) {
      results.push({
        name: entries[i],
        children: walk(entryPath)
      });
    } else if (entryStat.isFile()) {
      results.push(fileInfo(entries[i], entryStat));
    }
  }

  return results;
}

function fileInfo(name, stat) {
  return {
    name: name,
    inode: stat.ino
  };
}

console.log(JSON.stringify(walk('.')));

