/**
 * srchAndConsolidateDictFiles
 *
 * Scan a directory of partials and accumulate the json dictionaries into one json string
 *
 * Workflow:
 *  0.) read through .dict files in a directory
 *  1.) break up dot-partition into heirarchy
 *  2.) store text into the appropriate heirarchy
 *  3.) ... repeat for all files
 *  4.) dumpJSON
 *
 */

var DEBUG = true;
var exampleUsage = 'example usage: node ./src/srchHtmlForText.js /tmp/testDirectory';

var myArgs = require('optimist').argv, help = exampleUsage;
var fs = require('fs');
var path = require('path');
var partialsPath = '/../test/testHtml';
var directoryPath = __dirname;
var universalTranslator = require('./fnLostInTranslation');

if (myArgs._[0]) {
  console.log('...  processing path to scan :' + myArgs._[0]);
  directoryPath = '';
  partialsPath = myArgs._[0];
}

console.log('searching for files in:' + directoryPath + partialsPath);

// attempt to read the directory or die with error
try {
  var files = fs.readdirSync(directoryPath + partialsPath);
} catch (e) {
  console.log('Could not open this directory for reading:' + directoryPath + partialsPath);
  console.log(e);
}

var counter = 0;

var jsonDictionary = {};

// Go through the files in the directory and consolidate
for (var i in files) {

  counter++;

  var filePath = path.join(directoryPath + files[i]);

  if (DEBUG) {
    console.log('[DEBUG]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    console.log('[DEBUG]__dirname: ' + directoryPath);
    console.log('[DEBUG]_partials: ' + partialsPath);
  }

  // skip non-dictionary files
  if (!files[i].match(/\.dict/)) {
    console.log('[DEBUG - SKIPPING Non Dictionaries]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    continue;
  }

  // skip hidden files
  if (files[i].match(/^\./)) {
    console.log('[DEBUG - SKIPPING hidden]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    continue;
  }

  universalTranslator.readFileAndUpdateDictionary(directoryPath, filePath, partialsPath,
                                                  files[i], i, jsonDictionary);
}


