var dotlit = require('../lib/dotlit.js');

dotlit.load('litfiles/anon-code-blocks.lit.md', function (err, litFile) {
  console.log(litFile.files[0].contents);
});