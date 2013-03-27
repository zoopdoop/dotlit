var dotlit = require('../lib/dotlit.js'),
    prompt = require('cli-prompt');
    
prompt('enter your first name: ', function (val) {
  var first = val;
  prompt('and your last name: ', function (val, end) {
    console.log('hi, ' + first + ' ' + val + '!');
    end();
  });
});

dotlit.load('litfiles/anon-code-blocks.lit.md', function (err, litFile) {
  console.log(litFile.files[0].contents);
});