'use strict';

var dotlit = require('../lib/dotlit.js');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['test async loading'] = {
  setUp: function(done) {
    // setup here
    done();
  },
  'load file': function(test) {
    dotlit.load('test/litfiles/no-code-blocks.lit.md', function (err, litFile) {
      test.ok(litFile instanceof dotlit.LitFile, 'should have been LitFile');
      test.equal(litFile.filename, 'test/litfiles/no-code-blocks.lit.md', 'should have preserved filename');
      test.equal(litFile.extractFilename, 'no-code-blocks', 'should have created extract filename');
      test.equal(litFile.text, 'This file has no code blocks in it', 'should have preserved text');
      test.done();
    });
  },
  'empty file list': function(test) {
    dotlit.load('test/litfiles/no-code-blocks.lit.md', function (err, litFile) {
      test.equal(litFile.files.length, 0, 'should be 0 files');
      test.done();
    });
  },
  
  'anonymous code block file list': function(test) {
    dotlit.load('test/litfiles/anon-code-blocks.lit.md', function (err, litFile) {
      test.equal(litFile.files.length, 1, 'should be 1 file'); 
      test.equal(litFile.files[0].filename, 'anon-code-blocks', 'should be 1 file'); 
      test.equal(litFile.files[0].contents, '#include <stdio.h>\n\nint main() {\n    puts("Hello, world!");\n    \n    return 0;\n}\n', 'should have extracted code'); 
      test.done(); 
    });
  },
};
