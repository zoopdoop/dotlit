# dotlit 

Literate programming source code processor inspired by Jeremy Ashkenas' [Literate CoffeeScript](http://coffeescript.org/#literate).

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
$ dotlit --list test.js.lit 
foo.js
bar.js
baz.css
```

Extract all the files in a dotlit file
```sh
$ dotlit --extract test.js.lit 
```

Extract the foo.js file in the dotlit file
```sh
$ dotlit --extract foo.js test.js.lit 
```

Render a dotlit file as HTML
```sh
$ dotlit --renderHTML test.js.lit.html test.js.lit 
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
  res.send(litFile.renderHTML());
});

```

## Documentation

### dotlit Markup

dotlit is a transparent superset of [Markdown](http://daringfireball.net/projects/markdown/syntax).  Any Markdown processor can process a dotlit file and vice-versa.
So what does dotlit add?  Just one thing, filenames and operations to code blocks.

Here is a Markdown code block

    #include <stdio.h>

    int main() {
        puts("Hello, world!");
        return 0;
    }

Here is a dotlit code block which will allow you to extract a file named hello.c using the dotlit command or code.

    $ hello.c
    #include <stdio.h>

    int main() {
        puts("Hello, world!");
        return 0;
    }

So, big deal right?  Well imagine you have a tutorial on creating the Hello, world! code.  Let's put the tutorial text in _italics_ since you are probably reading this
from the rendered README.md file.

---------------------------------------
_**Tutorial: Creating "Hello, world!"**_
    
_First create a file named hello.c.  The first thing you will add is preprocessor command to tell the C compiler to load the standard io libary._

    $ hello.c
    #include <stdio.h>

_Then add the following lines which define the main entry point into the program._

    $+ hello.c

    int main() {
    }
    
_Finally lets make the program print out "Hello, world!" and exit with a status code of 0.  Add the following between the two braces after int main() _

    $3a4,5 hello.c
        puts("Hello, world!");
        return 0;
---------------------------------------

The previous example shows the three of the five file operations that dotlit adds.  Here are all five operations:

    $ text.txt
    This creates a new file called text.txt
    
    $+ test.txt
    This line gets appended to test.txt
    
    $1a2 test.txt
    This line is inserted at line 2 (pushing "This line gets appended to test.txt" to line 3)
    
    $1,2d0 test.txt
    This deletes the first two lines of test.txt.  This code block is ignored.
    
    $1c1 test.txt
    This is the new first line of the file.

The last three commands use the [diff](http://en.wikipedia.org/wiki/Diff) output format to specify how a file should change
    
## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013   
Licensed under the MIT license.
