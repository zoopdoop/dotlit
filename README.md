# dotlit 

Literate programming source code processor

## Getting Started
Install the module with: `npm install dotlit`

### Command Line

List all the files from a dotlit file
```sh
dotlit --list test.js.lit 
```

Extract all the files from a dotlit file
```sh
dotlit --extract test.js.lit 
```

Extract the foo.js file from the dotlit file
```sh
dotlit --extract foo.js test.js.lit 
```

Render a dotlit file as HTML
```sh
dotlit --renderHTML test.js.lit 
```

### In node.js app
```javascript
var dotlit = require('dotlit');

// load a lit file asynchronously and print number of files inside of it
dotlit.load('test.js.lit', function (err, litFile) {
  console.log(litFile.files.length);
});

// load a lit file synchronously and print the names of all the files inside of it
var litFile = dotlit.loadSync('test.js.lit');
litFile.files.forEach(function (file) {
  console.log(file.filename);
});

// load a lit file asynchronously and extract a file from it
dotlit.load('test.js.lit', function (err, litFile) {
  var file = litFile.extract('foo.js');
});

// load a lit file asynchronously and render an HTML view
dotlit.load('test.js.lit', function (err, litFile) {
  litFile.renderHTML();
});

```

## Documentation


## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013   
Licensed under the MIT license.
