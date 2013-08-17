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

function nodeForPath(path) {
  var
    pathComponents,
    i,
    j,
    node = library.library;

  if (path !== undefined) {
    pathComponents = path.split('/');
    for (i = 0; i < pathComponents.length; ++i) {
      for (j = 0; j < node.children.length; ++j) {
        if (pathComponents[i] === node.children[j].name) {
          break;
        }
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
    node = nodeForPath(params.path),
    result = [],
    i,
    child,
    o;

  for (i = 0; i < node.children.length; ++i) {
    child = node.children[i];

    o = { path: (params.path || '') + '/' + child.name };

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
    } else if (method === '/get_chunks/') {
      res.end(get_chunks(params));
    } else if (method.substring(0, 7) === '/chunk/') {
      chunk(method.substring(7), res);
    } else {
      res.end(error('unkown method'));
    }

  }).listen(PORT);
});

