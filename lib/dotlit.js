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
    marked = require('marked'),
    trim, LitFile, EmbeddedFile, _FileOperation;

// utilities    
trim = function (s) {
  return s.replace(/^\s+|\s+$/, '');
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
        fileLine = /^\s*\$\s*([^(]*)\s*(\((.*)\))?\s*$/,   // $ filename (operation)
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
          operation = trim(matches[3]);
          
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
  
  renderHTML: function () {
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
    var matches, lineNumber; 
    
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
          lines = lines.slice(0, lineNumber - 1).concat(this.lines).concat(lines.slice(lineNumber - 1));
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
        lines.splice.apply(null, [lineNumber - 1, parseInt(matches[2], 10)].concat(this.lines));
        return lines;
      }
    }
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
    
    return lines.join('\n');
  },
  
  get filename() {
    return this._filename;
  }
};

exports._processCommandLine = function() {
  console.log('not yet implemented');
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


