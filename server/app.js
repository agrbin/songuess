/*jslint indent: 2, plusplus: true */
"use strict";

var
  http = require('http'),
  url = require('url');

http.createServer(function (req, res) {
  var
    parsedUrl = url.parse(req.url, true),
    method = parsedUrl.pathname,
    params = parsedUrl.query;

  res.writeHead(200, {'Content-Type': 'text/plain'});

  if (method === '/search/') {
  
  } else if (method === '/ls') {
     
  } else {
    res.end('unkown method'); 
  }

}).listen(8000);

