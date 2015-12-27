var assert = require('assert');

// Load the function
eval(require('fs').readFileSync('chat.js', {encoding:'utf-8'}));

// Test the function
assert.equal(true, validChTarget('artist'));
assert.equal(true, validChTarget('title'));
assert.equal(true, validChTarget('album'));
assert.equal(true, validChTarget('title2'));
assert.equal(true, validChTarget('title3'));
assert.equal(true, validChTarget('title334'));

assert.equal(false, validChTarget('title0'));
assert.equal(false, validChTarget('title1'));
assert.equal(false, validChTarget('title02'));
assert.equal(false, validChTarget('title03'));
assert.equal(false, validChTarget('jebovladu'));
