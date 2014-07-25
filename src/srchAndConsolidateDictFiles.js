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

function saveDictionary(jsonContent) {

  'use strict';

  var dictFilename = 'dictionary.json';

  var content = JSON.stringify(jsonContent);

  fs.writeFile(dictFilename, content, function(err) {
    if (err) {
      console.log('SAVE FAILURE [' + dictFilename + '] was saved!' + err);
    } else {
      console.log('SAVE Success [' + dictFilename + '] was saved!');
    }
  });

}

function addDataToDictionary(dict, fileData) {

  'use strict';

  var combinedDictionary = dict;

  var transformedFileData = ''+fileData;

  // remove newline
  transformedFileData = transformedFileData.replace(/[\n\r]/g, '');

  // split into an array
  var dataPairs = transformedFileData.split(',');

  for (var idx in dataPairs) {

    var address = dataPairs[idx].replace(/\'(.*?)\'\s*\:\s*\'(.*?)\'/, '$1');

    var text = dataPairs[idx].replace(/\'(.*?)\'\s*\:\s*\'(.*?)\'/, '$2');

    //remove trailing periods on address
    address = address.replace(/\.$/, '');
    //remove spaces address
    address = address.replace(/\s/g, '');

    var addyArray = address.split('.');

    var objPtr = combinedDictionary;


    // Create object and set value within json
    for (var addyIdx in addyArray) {

      // if dictionary does not have property create it
      if (!objPtr.hasOwnProperty(addyArray[addyIdx]) &&
           addyIdx < (addyArray.length-1)) {
        objPtr[addyArray[addyIdx]] = {};
      } else {
        // we can set the value now
        if (addyIdx == (addyArray.length-1)) {
          objPtr[addyArray[addyIdx]] = text;
        }
      }

      // move pointer
      objPtr = objPtr[addyArray[addyIdx]];
    }

    if (DEBUG) {
      console.log('Processing one pair ('+dataPairs[idx]+')');
      console.log(' idx:     ' + idx);
      console.log(' address: ' + address);
      console.log(' text:    ' + text);
      console.log(' dict[address] = ' + objPtr);
      console.log(' dict = '+JSON.stringify(combinedDictionary));
    }

  }

  return combinedDictionary;

}

function readFileAndUpdateDictionary(filePath, i, jsonDictionary) {

  'use strict';

  fs.readFile(directoryPath + partialsPath + '/' + files[i], function(err, data) {
    var fileData = data;
    var fileName = i + ' : ' + filePath + '/';
    if (err) {
      console.log('![ERROR] in file read loop @ ' + fileName);
      throw err;
    }

    if (DEBUG) {
      console.log('[DEBUG] File Content:' + data);
    }

    jsonDictionary = addDataToDictionary(jsonDictionary, fileData);

    if (DEBUG) {
      console.log('[DEBUG] Dictionary = ' + JSON.stringify(jsonDictionary) );
    }

    saveDictionary(jsonDictionary);
  });
}


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

  readFileAndUpdateDictionary(filePath, i, jsonDictionary);
}


