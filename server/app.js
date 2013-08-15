/*jslint indent: 2, plusplus: true */
"use strict";

var
  http = require('http'),
  url = require('url'),
  library = require('../library/library.js'),
  PORT = 8080;

function nodeForPath(path) {
  var
    pathComponents,
    i,
    j,
    node = library.library;

  if (path === undefined) {
    return node;
  } else {
    pathComponents = path.split('/');
    for (i = 0; i < pathComponents.length; ++i) {
      for (j = 0; j < node.children.length; ++j) {
        if (pathComponents[i] === node.children[j].name) break;  
      }
      node = node.children[j];
    }
  }

  return node;
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

library.loadLibrary(function (filesFound) {
  console.log(filesFound + ' files found in library');
  console.log('listening on: ' + PORT);

  http.createServer(function (req, res) {
    var
      parsedUrl = url.parse(req.url, true),
      method = parsedUrl.pathname,
      params = parsedUrl.query;

    res.writeHead(200, {'Content-Type': 'text/plain'});

    console.log('method: ' + method);
    console.log('params: ' + JSON.stringify(params));
    console.log('');

    if (method === '/ls/') {
      res.end(ls(params)); 
    } else if (method === '/search/') {
            
    } else {
      res.end('unkown method'); 
    }

  }).listen(PORT);
});

