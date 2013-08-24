var yui = require('yuicompressor'),
  fs = require('fs');

function onError(err) {
  console.log(err);
  process.exit(1);
}

function finish(min_css, min_js, buf) {
  buf = buf.replace(/<!--css-->/g, min_css);
  buf = buf.replace(/<!--js-->/g, min_js);
  fs.writeFileSync("index.min.html", buf);
  process.exit(0);
}

// this work only for our specific index.html!
function minifyHtml(lines) {
  var it, line, css_regex, js_regex, m
    , css_content = "", js_content = "", buf = "";
  for (it = 0; it < lines.length; ++it) {
    line = lines[it];
    css_regex = /rel="stylesheet" href="([^."]+.css)"/g;
    js_regex = /script src="([^."]+.js)"/g;
    if (m = css_regex.exec(lines[it])) {
      if (css_content === "") buf += "<style><!--css--></style>";
      css_content += fs.readFileSync(m[1]) + "\n";
      continue;
    }
    if (m = js_regex.exec(lines[it])) {
      if (m[1] !== 'config.js') {
        if (js_content === "") buf += "<script><!--js--></script>";
        js_content += fs.readFileSync(m[1]) + "\n";
        continue;
      }
    }
    buf += line.trim();
  }
  yui.compress(
    css_content,
    {charset: 'utf8', type: 'css'},
    function(err, min_css, extra) {
      err && onError(err);
      extra && console.log(extra);
      yui.compress(
        js_content,
        {charset: 'utf8', type: 'js'},
        function(err, min_js, extra) {
          err && onError(err);
          extra && console.log(extra);
          finish(min_css, min_js, buf);
        }
      );
    }
  );
}

fs.readFile('index.html', function (err, data) {
  err && onError(err);
  minifyHtml(data.toString('utf-8').split("\n"));
});

