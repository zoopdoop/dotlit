/*
 * dotlit
 *
 * Literate programming source code processor
 *
 * https://github.com/zoopdoop/dotlit
 *
 * Copyright (c) 2013 Doug Martin, Zoopdoop, LLC.
 *
 * Licensed under the MIT license.
 * https://github.com/zoopdoop/dotlit/blob/master/LICENSE
 */

'use strict';

var fs = require('fs'),
    path = require('path'),
    trim, log, LitFile, EmbeddedFile, _FileOperation;
    
exports.version = "0.2.1";

// utilities    
trim = function (s) {
  return s.replace(/^\s+|\s+$/, '');
};

log = {
  info: console.info.bind(console, '[INFO]'),
  warn: console.warn.bind(console, '[WARN]'),
  error: function() {
    console.log.bind(console, '[ERROR]').apply(console, arguments);
  },
  isVerbose: false,
  verbose: function() {
    if (log.isVerbose) {
      console.log.bind(console, '[INFO]').apply(console, arguments);
    }
  }
};

exports.LitFile = LitFile = function (filename, text) {
  var parseResult;
  
  this._filename = filename;
  this._extractFilename = this._getExtractFilename(filename);
  this._text = text;
  
  parseResult = this._parse();
  this._files = parseResult.files;
  this._fileMap = parseResult.fileMap;
};
LitFile.prototype = {

  _getExtractFilename: function (filename) {
    var parts = filename.split(/\.lit(\.|$)/);
    return path.basename(parts[0]);
  },
  
  _parse: function () {
    var lines = this._text.split('\n'),
        files = [],
        fileMap = {},
        codeLine =/^(\t| {4})/,   // line starts with tab or four spaces
        fileLine = /^\$\s+([^(]*)\s*(\((.*)\))?\s*$/,   // $ filename (operation)
        currentFile = null, 
        extractFilename = this._extractFilename,
        getFile;
        
    getFile = function (filename) {
      if (!fileMap.hasOwnProperty(filename)) {
        fileMap[filename] = new EmbeddedFile(filename);
        files.push(fileMap[filename]);
      }
      return fileMap[filename];
    };
    
    lines.forEach(function (line) {
      var normalizedLine = line.replace('\t', '    ').substr(4),
          matches,
          filename, operation;
          
      // empty line?
      if (trim(line).length === 0) {
        // if we have an active file add the line, otherwise ignore
        if (currentFile !== null) {
          currentFile._addLine(normalizedLine);
        }
      }
      // code line?
      else if (codeLine.test(line)) {
        matches = normalizedLine.match(fileLine);
        
        // file line? 
        if (matches !== null) {
          filename = trim(matches[1]);
          operation = matches[3] !== undefined ? trim(matches[3]) : '';
          
          // anonymous block?
          if (filename.length === 0) {
            filename = extractFilename;
            // empty operations on anonymous blocks means append
            operation = operation.length === 0 ? '+' : operation;
          }
          
          currentFile = getFile(filename);
          currentFile._addOperation(operation);
        }
        else {
          // first line of anonymous block?
          if (currentFile === null) {
            currentFile = getFile(extractFilename);
            // anonymous blocks always append
            currentFile._addOperation('+');
          }
          
          currentFile._addLine(normalizedLine);
        }
      }
      // markdown line, so end the current file
      else {
        currentFile = null;
      }
    });
    
    return {
      files: files,
      fileMap: fileMap
    };
  },
  
  extract: function (filename) {
    return this._fileMap.hasOwnProperty(filename) ? this._fileMap[filename] : null;
  },
  
  get html() {
    var marked = require('marked');
    return marked(this._text);
  },
  
  get filename() {
    return this._filename;
  },

  get extractFilename() {
    return this._extractFilename;
  },
  
  get text() {
    return this._text;
  },
  
  get files() {
    return this._files;
  },
  
  get filenames() { 
    return this._files.map(function (file) { 
      return file.filename; 
    });
  },
  
  get fileMap() {
    return this._fileMap;
  }
};

exports._FileOperation = _FileOperation = function (operation) {
  this.operation = trim(operation);
  this.lines = [];
};
_FileOperation.prototype = {
  _lineOperation: /^(\d+)/,
  _replaceLine: /^(\d+)$/,
  _insertAtLine: /^(\d+)\s*\+$/,
  _deleteLines: /^(\d+)\s*\-\s*(\d+)$/,
  _replaceLines: /^(\d+)\s*\:\s*(\d+)$/,
  
  addLine: function (line) {
    this.lines.push(line);
  },
  
  execute: function (lines) {
    var matches, lineNumber, before, after; 
    
    // remove the trailing empty lines
    while (this.lines.length > 0) {
      if (trim(this.lines[this.lines.length - 1]).length === 0) {
        this.lines.pop();
        continue;
      }
      break;
    }
    
    // nothing means reset the file
    if (this.operation === '') {
      return this.lines;
    }
    
    // (+) - append lines
    if (this.operation === '+') {
      return lines.concat(this.lines);
    }
    
    // line operation?
    matches = this.operation.match(this._lineOperation);
    if (matches !== null) {
      lineNumber = Math.max(1, parseInt(matches[1], 10));
      
      // pad the lines to the line number
      while (lines.length + 1 < lineNumber) {
        lines.push('');
      }
    
      // (1) - replace line
      matches = this.operation.match(this._replaceLine);
      if (matches !== null) {
        lines[lineNumber - 1] = this.lines[0];
        return lines;
      }
      
      // (2+) - insert lines at line number
      matches = this.operation.match(this._insertAtLine);
      if (matches !== null) {
        if (lineNumber === 1) {
          // just prepend the new lines
          lines = this.lines.concat(lines);
        }
        else {
          // insert the lines
          before = lines.slice(0, lineNumber);
          after = lines.slice(lineNumber);
          lines = before.concat(this.lines).concat(after);
        }
        return lines;
      }
      
      // (1-2) - delete lines at line number
      matches = this.operation.match(this._deleteLines);
      if (matches !== null) {
        lines.splice(lineNumber - 1, parseInt(matches[2], 10));
        return lines;
      }
      
      // (1:2) - replace N lines at line number
      matches = this.operation.match(this._replaceLines);
      if (matches !== null) {
        lines.splice.apply(lines, [lineNumber - 1, parseInt(matches[2], 10)].concat(this.lines.slice()));
        return lines;
      }
    }
    
    return lines;
  }
};

exports.EmbeddedFile = EmbeddedFile = function (filename) {
  this._filename = filename;
  this._operations = [];
};
EmbeddedFile.prototype = {
  
  _addOperation: function (operation) {
    this._operations.push(new _FileOperation(operation));
  },
  
  _addLine: function (line) {
    var numOperations = this._operations.length;
    if (numOperations > 0) {
      this._operations[numOperations - 1 ].addLine(line);
    }
  },
  
  get contents() {
    var lines = [];
    
    this._operations.forEach(function (operation) {
      lines = operation.execute(lines);
    });
    
    return [lines.join('\n'), '\n'].join('');
  },
  
  get filename() {
    return this._filename;
  }
};

exports._getCommandLineOptions = function(args) {
  var flags = {
        '--help': 'help',
        '--list': 'list',
        '--extract-all': 'extractAll',
        '--print-all': 'printAll',
        '--verbose': 'verbose',
        '--force': 'force'
      },
      options = {
        help: false,
        list: false,
        extractAll: false,
        printAll: false,
        verbose: false,
        force: false,
        file: null,
        render: null,
        extractFiles: [],
        printFiles: [],
        error: false
      },
      checkFlag, hasFlag, arg, argFilename;
      
  checkFlag = function (option, arg) {
    if (flags[option].indexOf(arg) !== -1) {
      options[option] = true;
      return true;
    }
    return false;
  };
        
  // Look at each of the args. I could have used the optimist module here but I wanted to make it testable
  while ((args.length > 0) && (options.error === false)) {
    arg = args.shift();
       
    // filename?
    if (arg[0] !== '-') {
      // get the dotlit filename
      if (options.file !== null) {
        options.error = 'Only one dotlit file is allowed';
      }
      options.file = arg;
    }
    // option with value?
    else if (['--extract', '--print', '--render'].indexOf(arg) !== -1) {
      // get the file
      argFilename = args.shift();
      if ((argFilename === undefined) || (argFilename.length === 0) || (argFilename[0] === '-')) {
        options.error = ['Missing filename for ', arg].join('');
      }
      if (arg === '--extract') {
        options.extractFiles.push(argFilename);
      }
      else if (arg === '--print') {
        options.printFiles.push(argFilename);
      }
      else {
        options.render = argFilename;
      }
    }
    else {
      hasFlag = flags.hasOwnProperty(arg);
      if (hasFlag) {
        options[flags[arg]] = true;
      }
      else {
        options.error = ['Unknown option ', arg].join('');
      }
    }
  }

  // override any previous error with the main one
  if (options.file === null) {
    options.error = 'Missing dotlit filename';
  }
  
  // default to list if no other option given
  options.list = options.list || ((options.render === null) && !options.extractAll && (options.extractFiles.length === 0) && !options.printAll && (options.printFiles.length === 0));
  
  return options;
};

exports._processCommandLine = function() {
  var options = exports._getCommandLineOptions(process.argv.splice(2)),
      litFile, printAllLine;
      
  if (options.help) {
    console.log([
        ['dolit version ', exports.version].join(''),
        '',
        ['Usage: ', path.basename(process.argv[1]), ' <file> [options]'].join(''),
        '',
        'Options:',
        '  --list            Lists the embedded files (default if no option is given)',
        '  --extract <file>  Extracts the specified embedded file',
        '  --extract-all     Extracts all the embedded files',
        '  --print <file>    Prints the specified embedded file to stdout',
        '  --print-all       Prints all the embedded files to stdout',
        '  --render <file>   Renders the dotlit file as html',
        '  --force           Skips confirmation when extracting files outside the current directory',
        '  --verbose         Shows messages while processing',
        '  --help            Shows this information' 
        ].join('\n'));
    return 0;
  }  
  
  if (options.error !== false) {
    log.error([options.error, '.  Use --help for usage guidelines.'].join(''));
    return 3;
  }
  
  // set the verbosity level
  log.isVerbose = options.verbose;
  
  // open the file
  try {
    litFile = exports.loadSync(options.file);
  }
  catch (err) {
    log.verbose('Error opening', options.file, err);
    if (err.errno === 34) {
      log.error('Unable to open', options.file);
      return 3;
    }
    throw err;
  }
  
  // if extracting or printing all just grab all the files  
  if (options.extractAll) {
    options.extractFiles = litFile.filenames;
  }
  if (options.printAll) {
    options.printFiles = litFile.filenames;
  }
  
  // list?
  if (options.list) {
    litFile.filenames.forEach(function (filename) {
      console.log(filename);
    });
  }
  
  // print?
  if (options.printFiles.length > 0) {
    printAllLine = (new Array(80)).join('-');
    options.printFiles.forEach(function (filename) {
      var embeddedFile = litFile.extract(filename);
      if (embeddedFile === null) {
        log.error('Unable to find', filename, 'in dotlit file');
      }
      else {
        if (options.printFiles.length > 1) {
          console.log(filename);
          console.log(printAllLine);
        }
        console.log(embeddedFile.contents);
      }
    });
  }
  
  // check (and prompt) if the file exists outside the tree or if the file is newer
  // this has to be done with a callback as stdio only uses events
  if (options.render || (options.extractFiles.length > 0)) {
    exports._checkBeforeWriting(options, function (checkedRender, checkedExtractFiles) {
      // render html?
      if (checkedRender !== null) {
        if (exports._writeFileSync(checkedRender, litFile.html)) {
          log.verbose('Rendered to', checkedRender);
        }
      }
      
      // extract files?
      checkedExtractFiles.forEach(function (filename) {
        var embeddedFile = litFile.extract(filename);
            
        if (embeddedFile !== null) {
          if (exports._writeFileSync(filename, embeddedFile.contents)) {
            log.verbose('Extracted', filename);
          }
        }
        else {
          log.error('Unable to find', filename, 'in dotlit file');
        }
      });
    });
  }
  
  return 0;
};

exports._checkBeforeWriting = function(options, done) {
  var checkedRender = null,
      checkedExtractFiles = [],
      checkExtractedFiles;
      
  if (options.force) {
    done(options.render, options.extractFiles);
    return;
  }
      
  checkExtractedFiles = function (index) {
    index = index || 0;
    if (index < options.extractFiles.length) {
      exports._checkBeforeWritingPrompt('Extract', options.extractFiles[index], function () {
        checkedExtractFiles.push(options.extractFiles[index]);
      }, function () {
        checkExtractedFiles(index + 1);
      });
    }
    else {
      done(checkedRender, checkedExtractFiles);
    }
  };

  if (options.render !== null) {
    exports._checkBeforeWritingPrompt('Render', options.render, function () {
      checkedRender = options.render;
    }, checkExtractedFiles);
  }
  else {
    checkExtractedFiles();
  }
};

exports._checkBeforeWritingPrompt = function (action, filename, ifYes, done) {
  var prompt = require('cli-prompt'),
      cwd = process.cwd(),
      resolvedPath = path.resolve(cwd, filename),
      promptText;
  
  promptText = cwd !== resolvedPath.substr(0, cwd.length) ? ([action, ' ', filename, '? (outside of tree) [y/N] '].join('')) : null;
  if (promptText !== null) {
    prompt(promptText, function (val, end) {
      if ((val === 'y') || (val === 'yes')) {
        ifYes();
      }
      end();
      done();
    });
  }
  else {
    ifYes();
    done();
  }
};

exports._writeFileSync = function (filename, text) {
  try {
    fs.writeFileSync(filename, text);
  }
  catch (err) {
    log.error('Unable to write', filename, err);
    return false;
  }
  return true;
};

exports.load = function (filename, done) {
  fs.readFile(filename, 'utf8', function (err, data) {
    return err ? done(err) : done(null, exports.create(filename, data));
  });
};

exports.loadSync = function (filename) {
  var data = fs.readFileSync(filename, 'utf8');
  return data === null ? null : exports.create(filename, data);
};

exports.create = function (filename, data) {
  return new LitFile(filename, data);
};


