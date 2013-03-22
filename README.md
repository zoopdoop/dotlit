# dotlit 

A literate programming source code processor.

## What Is dotlit?
dotlit is a transparent extension to [Markdown](http://daringfireball.net/projects/markdown/syntax) that adds semantics to Markdown code blocks.  It allows you to easily:

1. Use anonymous code blocks to document a single source file using Markdown and then filter out the Markdown to recover the original source. 
2. Use named code blocks to embed any number of source code files from any programming language into a Markdown document and then easily extract them out later.  
3. Combine named and anonymous code blocks to include dependent files inside a main source file.  

Since it is a transparent extension any existing Markdown processor can process any dotlit file. 

## Uses for dotlit?

1. Adding meta documentation that you don't want to be shipped with the source code.  These can be things like design decisions you
made, checklists of requirements, references to online documentation or comments to files that don't provide for a comments, like json files.
This [literate programming](http://en.wikipedia.org/wiki/Literate_programming) style has recently had a reawakening due to 
Jeremy Ashkenas' [Literate CoffeeScript](http://coffeescript.org/#literate) (which inpart inspired dotlit's creation).
2. Gathering and documenting a set of files.  A good example is a [chef](http://www.opscode.com/chef/) recipe that with five customized files.
Instead of having separate (or no) documenation on what was changed in the files you can have a single dotlit file that contains all the documenation and
the files with their full paths preserved.
3. Developing code using a single file but compiling/serving it using multiple files.  In web development combining html, css and Javascript in a single file is
not a good idea because it limits testability and often violates the [DRY principle](http://en.wikipedia.org/wiki/Don%27t_repeat_yourself).  However, keeping all the
related code in one file does often provide for a quicker development cycle because you are not constantly switching between files.  With dotlit you can combine
the files during development and easily extract them for testing/compiling/serving and get a meta documenation facility as a bonus.
4. Writing tutorials or ebooks containing code you can validate.  How many tutorials or ebooks have you read that have syntax errors in the code samples because they
were just pasted in after the fact?  Because dotlit is simply Markdown you can use any of the wide variety of tools to render the dotlit file as
HTML, PDF or the various eBook formats and still be able to extract and verify the code with the bonus of being able to also deliver all of the source
files separately.  This was the original inspiration for dotlit (after talking to (Paul Bissex)[https://twitter.com/pbx] at a developer's group about how he [used Markdown to co-write](http://news.e-scribe.com/440)
his [Django book](http://withdjango.com/)).

## dotlit Markup

### Anonymous Code Blocks
Anonymous code blocks are simply Markdown code blocks.

    #include <stdio.h>

    int main() {
        puts("Hello, world!");
        return 0;
    }

If this anonymous code block was inside a file named hello.c.lit.md you could extract the code into hello.c using this command:
```sh
$ dotlit hello.c.lit.md --extract
```

The placement of the .lit extension in the filename sets the end of the extracted filename in a document with 
anonymous code blocks.  The following three files with anonymous code blocks would extract out to test.js.

1. test.js.lit.md
2. test.js.lit.dev.md
3. test.js.lit
    
### Named Code Blocks
Named code blocks allow you embed a named file in a Markdown document.  The $ character (when it is the first non-whitespace character in a code block) denotes a dotlit file operation.

    $ hello.c
    #include <stdio.h>

    int main() {
        puts("Hello, world!");
        return 0;
    }

If this named code block was in a file named programming-tutorial.lit.md you could extract the code into hello.c using this command:
```sh
$ dotlit programming-tutorial.lit.md --extract hello.c
```
    
### Simple Named Code Blocks Example
Imagine you are writing a simple tutorial about creating the "Hello, world!" code.  You could extract your code from your tutorial as you
write it to make sure it compiles and your reader could extract it later to get the hello.c file themselves.  You could also render the
dotlit file as HTML and deliver it along with the extracted files.

---------------------------------------

_**Tutorial: Creating "Hello, world!"**_
    
_First create a file named hello.c using your favorite editor.  The first thing you will add is preprocessor command to tell the C compiler to load the standard io libary._

    $ hello.c
    #include <stdio.h>

_Then add the following lines to hello.c to define the main entry point into the program._

    $ hello.c (+)

    int main() {
    }

_Finally let's make the program print out "Hello, world!" and exit with a status code of 0.  Add the following between the two braces:_

    $ hello.c (3+)
        puts("Hello, world!");
        return 0;

_Compile hello.c with your favorite compiler and you are done!_

---------------------------------------

The previous simple example shows the three of the file operations that dotlit adds.  Here are all operations:

    $ text.txt
    This creates a new file called text.txt since there is no operator after the filename.

    $ test.txt (+)
    This line gets appended to test.txt at line 2. The plain "+" means insert at the end of the file.

    $ test.txt (2+)
    These twos lines are inserted at line 2, pushing "This line gets appended to test.txt" to line 4.
    The "2+" means insert the text at line 2.  You can have any number of lines here.

    $ test.txt (1-2)
    This deletes the first two lines of test.txt.  The "1-2" means delete two lines starting at line 1.
    The content of this code block is ignored but will be flagged if the dotlit command renders it to HTML.
    
    $ test.txt (1)
    This is the new first line of the file.  The bare "1" means replace line 1 in test.txt
    This second line is ignored since we only specified a single line replacement.  
    This code block will be flagged if the dotlit command renders it to HTML since it has more than one line.

    $ test.txt (1:2)
    This is the new first line of the file.  The "1:2" means replace two lines starting at line 1 with these 
    three lines.  The number of new lines in the code block does not need to match the number of lines
    that are replaced, so this line would also be added to the file.
    
    [no $ at the top of a code block]
    This declares an anonymous code block.  If you have multiple anonymous code blocks they append to one another.
    
    $ [no file name]
    This is also an anonymous code block that allows you to use any of the parenthetical operators mentioned above
    such as "$ (2+)" or "$ (1:2)".

Each operation accumulates so for instance deleting the first two lines in a row actually deletes four total lines.

    $ test.txt (1-2)
    $ test.txt (1-2)

### File Operation Format    

- (+) append the contents of the code block to end of file
- (L+) append the contents of the code block starting at line L
- (L-C) delete C lines starting at line L and ignore the contents of the code block
- (L) replace line L with the first line of the code block 
- (L:C) replace C lines starting at line L with the entire contents of the code block 

## Getting Started
dotlit is a [node.js](http://nodejs.org/) module that has both a command line component and a library that you can
use in your own node.js projects.  You don't have to be a node.js programmer to use the command line interface but
you do need to have node.js installed.

Once you install node.js install the module with: `npm install -g dotlit`

### Command Line Interface

#### Using dotlit files with named code blocks

List all the files
```sh
$ dotlit named-blocks.lit.md --list 
index.html
assets/js/app.js
assets/js/api.js
assets/css/app.css
/etc/nginx/sites-available/example.com
```

Extract all the files.  You will need to give confirmation for any files extracted when they are outside of the current directory 
or its subdirectories or if the file already exists and it has a newer file date than the dotlit file.  You use the --force parameter
to disable these checks.
```sh
$ dotlit named-blocks.lit.md --extract-all --verbose
Extracted index.html
Extracted assets/js/app.js
Extract assets/js/api.js? (overwriting changed file) [y/N] N
Skipped extracting assets/js/api.js
Extracted assets/css/app.css
Extract /etc/nginx/sites-available/example.com? (outside of tree) [y/N] y
Extracted /etc/nginx/sites-available/example.com
```

Extract the foo.js file
```sh
$ dotlit named-blocks.lit.md --extract assets/js/foo.js 
```

Render a dotlit file as HTML
```sh
$ dotlit named-blocks.lit.md --renderHTML named-blocks.html 
```

#### Using dotlit files with only anonymous code blocks

List all the files
```sh
$ dotlit anonymous-blocks.js.lit.md --list 
anonymous-blocks.js
```

Extract the code into anonymous-blocks.js
```sh
$ dotlit anonymous-blocks.js.lit.md --extract 
```

#### Using dotlit files with a mix of named and anonymous code blocks

```sh
$ dotlit mixed-blocks.js.lit.md --list 
mixed-blocks.js
foo.js
bar.js
baz.css
```

Extract all the files
```sh
$ dotlit mixed-blocks.js.lit.md --extract-all 
```

Extract the foo.js file
```sh
$ dotlit mixed-blocks.js.lit.md --extract foo.js 
```

Extract the mixed-blocks.js file
```sh
$ dotlit mixed-blocks.js.lit.md --extract 
```

### Library Interface
```javascript
var dotlit = require('dotlit');

// load a lit file asynchronously and print number of files inside of it
dotlit.load('test.lit.md', function (err, litFile) {
  console.log(litFile.files.length);
});

// load a lit file synchronously and print the names of all the files inside of it
var litFile = dotlit.loadSync('test.lit.md');
litFile.files.forEach(function (file) {
  console.log(file.filename);
});

// load a lit file asynchronously and extract a file from it
dotlit.load('test.lit.md', function (err, litFile) {
  var file = litFile.extract('foo.js');
});

// load a lit file asynchronously and render an HTML view
dotlit.load('test.lit.md', function (err, litFile) {
  res.send(litFile.renderHTML());
});

```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

- 0.0.1 Initial Release.  README driven development phase.

## License
Copyright (c) 2013   
Licensed under the MIT license.
