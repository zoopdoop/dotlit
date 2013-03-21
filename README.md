# dotlit 

Literate programming source code processor.

## What is dotlit?
dotlit is a simple extension to [Markdown](http://daringfireball.net/projects/markdown/syntax) that allows you to easy do three things:

1. Use named code blocks to embed any number of source code files from any programming language into a Markdown document and then easily extract them out later.  
2. Use anonymous code blocks to document a single source file using Markdown in the style of Jeremy Ashkenas' [Literate CoffeeScript](http://coffeescript.org/#literate)
and then filter out the Markdown to recover the original source.
3. Combine named and anonymous code blocks to include dependent files inside a main source file.

## Why use dotlit?

1. Do you ever need to combine code or config files with instructions?  With dotlit you can create one document that has all the instuctions and all the files with the exact paths.
2. Have you ever had to document how to change an existing file either by searching and replacing or adding, deleting or changing lines?
3. Would you like to keep all the html, css and js for a simple page in one file for development but seperate for production?
4. Are you bored and would like to try something cool?

## Getting Started
Install the module with: `npm install dotlit`

### Command Line

#### Using dotlit files with named code blocks

List all the files
```sh
$ dotlit --list named-blocks.lit.md
foo.js
bar.js
baz.css
```

Extract all the files
```sh
$ dotlit --extract-all named-blocks.lit.md 
```

Extract the foo.js file
```sh
$ dotlit --extract foo.js named-blocks.lit.md 
```

Render a dotlit file as HTML
```sh
$ dotlit --renderHTML named-blocks.html named-blocks.lit.md 
```

#### Using dotlit files with only anonymous code blocks

List all the files
```sh
$ dotlit --list anonymous-blocks.js.lit.md 
anonymous-blocks.js
```

Extract the code into anonymous-blocks.js
```sh
$ dotlit --extract anonymous-blocks.js.lit.md 
```

#### Using dotlit files with a mix of named and anonymous code blocks

$ dotlit --list mixed-blocks.js.lit.md
mixed-blocks.js
foo.js
bar.js
baz.css
```

Extract all the files
```sh
$ dotlit --extract-all mixed-blocks.js.lit.md 
```

Extract the foo.js file
```sh
$ dotlit --extract foo.js mixed-blocks.js.lit.md 
```

Extract the mixed-blocks.js file
```sh
$ dotlit --extract mixed-blocks.js.lit.md 
```

### In node.js app
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

## Documentation

### Why is the file extension .lit.md and not md.lit?

dotlit is a transparent superset of Markdown.  Any Markdown processor can process a dotlit file with no changes so by naming the files 
.lit.md we get to use all the existing Markdown renders across the Internet.

One importatnt note: the placement of the .lit extension sets the end of the filename when you extract code from a document with 
anonymous code blocks.  The following three files with anonymous code blocks would extract out to test.js.

1. test.js.lit.md
2. test.js.lit.dev.md
3. test.js.lit

### dotlit Markup

Here is a dotlit file with an anonymous code block.  It looks exactly like a Markdown code block.

    #include <stdio.h>

    int main() {
        puts("Hello, world!");
        return 0;
    }

If this was in a file named hello.c.lit.md you could extract the code into hello.c using this command:
```sh
$ dotlit --extract hello.c.lit.md
```
    
Here is a dotlit code block which will allow you embed hello.c in a Markdown document with any name.  The $ character (when it is the first non-whitespace
character in a code block) denotes a dotlit file operation.

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

    $ hello.c (+)

    int main() {
    }

_Finally lets make the program print out "Hello, world!" and exit with a status code of 0.  Add the following between the two braces:_

    $ hello.c (3+)
        puts("Hello, world!");
        return 0;

---------------------------------------

The previous example shows the three of the file operations that dotlit adds.  Here are all operations:

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
    
    $ test.text (s/code/markdown code/)
    This replaces "code" with "markdown code".  The contents of this code block is ignored.
    See below on how you can change the search range.

    [no $ at the top of a code block]
    This declares an anonymous code block.  If you have multiple anonymous code blocks they append to one another.
    
    $ [no file name]
    This is also an anonymous code block that allows you to use any of the parenthetical operators mentioned above
    such as "$ (2+)" or "$ (1:2)".

Note each operation accumulates so for instance delteing the first two lines in a row actually deletes four total lines.

    $ test (1-2)
    $ test (1-2)

### File Operation Format    
Here is a formal specification of the dotfile code block file operations where L means line number and C means count.

- (+) append the contents of the code block to end of file
- (L+) append the contents of the code block starting at line L
- (L-C) delete C lines starting at line L and ignore the contents of the code block
- (L) replace line L with the first line of the code block 
- (L:C) replace C lines starting at line L with the entire contents of the code block 
- (s/search/replace/i) use the search expression and replace it.  The i is optional and makes the search case-insensitive.

### Search And Replacing

The search parameter in a search and replace file operation is a [Javascript regular expression](https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Regular_Expressions) and
the replacement is a string that can contain special replacement patterns outlined in the above link.

You can specify a range to search in the file.  The syntax is similar to the vi search and replace syntax but modified to match the dotlit file operations.

- s/search/replace/ search the entire file
- 3s/search/replace/ search only on line 3
- 2+s/search/replace/ search starting at line 2 to the end of the file
- 2:4s/search/replace/ search starting at line 2 and for the next four lines

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_

## License
Copyright (c) 2013   
Licensed under the MIT license.
