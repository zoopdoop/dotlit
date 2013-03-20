# dotlit 

Literate programming source code processor inspired by Jeremy Ashkenas' [http://coffeescript.org/#literate](Literate CoffeeScript).

## What is dotlit?
dotlit allows you to embed any number of source code files from any programming language into a single Markdown styled document.

## Why use dotlit?

1. Do you ever need to combine code or config files with instructions?  With dotlit you can create one document that has all the instuctions and all the files with the exact paths.
2. Would you like to keep all the html, css and js for a page in one file for development but seperate for production?
3. You are bored and would like to try something new.

## Getting Started
Install the module with: `npm install dotlit`

### Command Line

List all the files in a dotlit file
```sh
dotlit --list test.js.lit 
```

Extract all the files in a dotlit file
```sh
dotlit --extract test.js.lit 
```

Extract the foo.js file in the dotlit file
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

### dotlit Markup

dotlit is a transparent superset of [http://daringfireball.net/projects/markdown/syntax](Markdown).  Any Markdown processor can process a dotlit file and vice-versa.
So what does dotlit add?  Just one thing, filenames and operations to code blocks.

Here is a Markdown code block

    #include <stdio.h>
    int main() {
        puts("Hello, world!");
        return 0;
    }

Here is a dotlit code block which will allow you to extract a file named hello.c

    $ hello.c
    #include <stdio.h>
    int main() {
        puts("Hello, world!");
        return 0;
    }

And here are two dotlit code blocks which combine and will allow you to extract a file named hello.c

    $ hello.c
    #include <stdio.h>
    
    $+ hello.c
    int main() {
        puts("Hello, world!");
        return 0;
    }
    
    
## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013   
Licensed under the MIT license.
