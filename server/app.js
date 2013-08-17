/*jslint indent: 2, plusplus: true */
"use strict";

var
  http = require('http'),
  url = require('url'),
  fs = require('fs'),
  library = require('../library/library.js'),
  urlsTable = {},
  chunksTable = {},
  PORT = 8080;

function fixPath(path) {
  if (path === undefined) {
    return '/';
  }

  if (path[path.length - 1] === '/') {
    path = path.substring(0, path.length - 1);
  }

  if (path[0] !== '/') {
    return '/' + path;
  }
  return path;
}

function nodeForPath(path) {
  var
    pathComponents = fixPath(path).split('/'),
    i,
    j,
    node = library.library;

  for (i = 0; i < pathComponents.length; ++i) {
    if (pathComponents[i].length > 0) {
      for (j = 0; j < node.children.length; ++j) {
        if (pathComponents[i] === node.children[j].name) {
          break;
        }
      }
      if (j === node.children.length) {
        return undefined;
      }
      node = node.children[j];
    }
  }

  return node;
}

function error(msg) {
  var o = { error: msg };
  return JSON.stringify(o);
}

function ls(params) {
  var
    path = fixPath(params.path),
    node = nodeForPath(path),
    result = [],
    i,
    child,
    o,
    pathPrefix = (path === '/') ? '/' : path + '/';

  if (node === undefined) {
    return error('path not found');
  }

  for (i = 0; i < node.children.length; ++i) {
    child = node.children[i];

    o = { path: pathPrefix + child.name };

    if (child.children) { // folder
      o.type = 'directory';
      o.count = child.filesCount;
    } else {
      o.type = 'file';
    }

    result.push(o);
  }

  return JSON.stringify(result);
}

function rndString() {
  return Math.random().toString(36).substring(2);
}

function get_chunks(params) {
  var
    id = params.id,
    fileInfo = library.filesById[id],
    i,
    urls,
    rndUrl;

  if (fileInfo === undefined) {
    return error('invalid id');
  }

  if (urlsTable[id] === undefined) {
    urls = [];
    for (i = 0; i < fileInfo.numberOfChunks; ++i) {
      rndUrl = rndString();
      chunksTable[rndUrl] = {
        inode: id,
        index: i
      };
      urls.push(rndUrl);
    }
    urlsTable[id] = {
      urls: urls,
      timestamp: (new Date()).getTime()
    };
  }

  return JSON.stringify(urlsTable[id].urls);
}

function chunk(url, res) {
  var
    chunkInfo = chunksTable[url],
    path;

  if (chunkInfo === undefined) {
    res.end(error('chunk not found'));
  } else {
    path = '../chunks/' + chunkInfo.inode + '/' + chunkInfo.index + '.mp3';
    fs.readFile(path, function (err, data) {
      if (err) {
        res.end(error('unexpected error, chunk file not found'));
      } else {
        res.setHeader('Content-Type', 'text/plain'); // TODO:
        res.setHeader('Cache-Control', 'max-age=3600'); // 1 hour
        res.setHeader('Access-Control-Allow-Origin', '*'); // TODO:
        res.end(data);
      }
    });
  }
}

function expand(arr) {
  var
    i,
    item,
    result = [];

  function expandNode(node) {
    var i;
    if (node.children) {
      for (i = 0; i < node.children.length; ++i) {
        expandNode(node.children[i]);
      }
    } else {
      result.push({
        artist: node.artist,
        album: node.album,
        title: node.title,
        duration: node.duration,
        id: node.inode
      });
    }
  }

  for (i = 0; i < arr.length; ++i) {
    item = nodeForPath(arr[i].path);
    expandNode(item);
  }

  return JSON.stringify(result);
}

library.loadLibrary(function (filesFound) {
  console.log(filesFound + ' files found in library');
  console.log('listening on: ' + PORT);

  http.createServer(function (req, res) {
    var
      parsedUrl = url.parse(req.url, true),
      method = parsedUrl.pathname,
      params = parsedUrl.query;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');

    console.log('method: ' + method);
    console.log('params: ' + JSON.stringify(params));
    console.log('');

    if (method === '/ls/') {
      res.end(ls(params));
    } else if (method === '/expand/') {
      req.content = '';
      req.addListener('data', function (data) {
        req.content += data;
      });
      req.addListener('end', function () {
        var o = JSON.parse(req.content.toString());
        res.end(expand(o));
      });
    } else if (method === '/get_chunks/') {
      res.end(get_chunks(params));
    } else if (method.substring(0, 7) === '/chunk/') {
      chunk(method.substring(7), res);
    } else {
      res.end(error('unkown method'));
    }

  }).listen(PORT);
});

