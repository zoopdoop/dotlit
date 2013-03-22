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
    trim, LitFile, File, FileOperation;

// utilities    
trim = function (s) {
  return s.replace(/^\s+|\s+$/, '');
};

exports.LitFile = LitFile = function (filename, text) {
  var parseResult;
  
  this.filename = filename;
  this.extractFilename = this.getExtractFilename(filename);
  this.text = text;
  
  parseResult = this.parse(this.extractFilename, text);
  this.files = parseResult.files;
  this.fileMap = parseResult.fileMap;
};
LitFile.prototype = {
  
  getExtractFilename: function (filename) {
    var parts = filename.split(/\.lit(\.|$)/);
    return path.basename(parts[0]);
  },
  
  parse: function (extractFilename, text) {
    var lines = text.split('\n'),
        files = [],
        fileMap = {},
        codeLine =/^(\t| {4})/,   // line starts with tab or four spaces
        fileLine = /^\s*\$\s*([^(]*)\s*(\((.*)\))?\s*$/,   // $ filename (operation)
        currentFile = null, 
        getFile;
        
    getFile = function (filename) {
      if (!fileMap.hasOwnProperty(filename)) {
        fileMap[filename] = new File(filename);
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
          currentFile.addLine(normalizedLine);
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
          currentFile.addOperation(operation);
        }
        else {
          // first line of anonymous block?
          if (currentFile === null) {
            currentFile = getFile(extractFilename);
            // anonymous blocks always append
            currentFile.addOperation('+');
          }
          
          currentFile.addLine(normalizedLine);
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
  }
};

exports.FileOperation = FileOperation = function (operation) {
  this.operation = trim(operation);
  this.lines = [];
};
FileOperation.prototype = {
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

exports.File = File = function (filename) {
  this.filename = filename;
  this._operations = [];
};
File.prototype = {
  
  addOperation: function (operation) {
    this._operations.push(new FileOperation(operation));
  },
  
  addLine: function (line) {
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
  }
};

exports.processCommandLine = function() {
  console.log('not yet implemented');
};

exports.load = function (filename, done) {
  
  fs.readFile(filename, 'utf8', function (err, data) {
    var litFile;
    
    if (err) {
      done(err);
      return;
    }
    
    // create the litFile
    litFile = new LitFile(filename, data);
    
    done(null, litFile);
  });
};

