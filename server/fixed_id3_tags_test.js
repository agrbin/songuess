var Sut = require('./fixed_id3_tags.js').FixedID3Tags;
var sut = new Sut(/*media=*/ null);
var assert = require('assert');

assert.equal(true, sut.validAltTitle({title: "1"}));
assert.equal(true, sut.validAltTitle({title: "1", title2: "2"}));
assert.equal(true, sut.validAltTitle({title: "1", title2: "2", title3: "3"}));
assert.equal(true, sut.validAltTitle({title3: "1", title2: "2", title: "3"}));

assert.equal(false, sut.validAltTitle({title2: "1"}));
assert.equal(false, sut.validAltTitle({title: "1", title3: "2"}));
assert.equal(false, sut.validAltTitle({title: "1", title2: "2", title4: "3"}));

assert.deepEqual({}, sut.sanitizeItem({title: 5}));
assert.deepEqual({}, sut.sanitizeItem({title: ''}));
assert.deepEqual({title: 'a'}, sut.sanitizeItem({title: 'a'}));
assert.deepEqual({}, sut.sanitizeItem({title2: 5}));
assert.deepEqual({baba: 5}, sut.sanitizeItem({baba: 5}));
