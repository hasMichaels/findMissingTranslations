/*
    optimizeJsonDictionary.js

    Report and reduce collisions within the current dictionary

    Outline:
    0.) load common dictionary for reference
    1.) load .dict mappings
    2.) perform a reverse map and collect collisions
    3.) analyze collision:
        3.a) if not collided then it should be fine and exist in the file
        @todo: 3.b) if it exists within the parent namespace then rename to exist within the parent namespace
        @todo: 3.c) if it exists in multiple namespaces promote to common and update common dictionary
    4.) compare and reduce dynamic and static

    @todo : undefined and empty shows up in Collisions.  I need to filter this out.

 */


var DEBUG = true;
var exampleUsage = 'example usage: node ./src/optimizeJsonDictionary.js /tmp/testDirectory';

var myArgs = require('optimist').usage(exampleUsage).argv;
var fs = require('fs');
var path = require('path');
var partialsPath = '/../test/testHtml';
var directoryPath = __dirname;

var _ = require('underscore');

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
var invertDictionary = {};
var collisions = {};

function saveDictionary(jsonContent) {

  var dictFilename = 'dictionary.json';

  var content = JSON.stringify(jsonContent);

  fs.writeFile(dictFilename, content, function(err) {
    if (err) {
      console.log("SAVE FAILURE [" + dictFilename + "] was saved!" + err);
    } else {
      console.log("SAVE Success [" + dictFilename + "] was saved!");
    }
  });

}


function saveCollisions(jsonContent) {

  var dictFilename = 'collisions.json';

  var content = JSON.stringify(jsonContent);

  fs.writeFile(dictFilename, content, function(err) {
    if (err) {
      console.log("SAVE FAILURE [" + dictFilename + "] was saved!" + err);
    } else {
      console.log("SAVE Success [" + dictFilename + "] was saved!");
    }
  });

}


function addDataToDictionary(dict, fileData) {

  var combinedDictionary = dict;

  var transformedFileData = ""+fileData;

  // remove newline
  transformedFileData = transformedFileData.replace(/[\n\r]/g, '');

  // split into an array
  var dataPairs = transformedFileData.split(',');

  for (var idx in dataPairs) {

    var address = dataPairs[idx].replace(/\"(.*?)\"\s*\:\s*\"(.*?)\"/, "$1");

    var text = dataPairs[idx].replace(/\"(.*?)\"\s*\:\s*\"(.*?)\"/, "$2");

    //remove trailing periods on address
    address = address.replace(/\.$/, '');
    //remove spaces address
    address = address.replace(/\s/g, '');

    //remove heading spaces on text
    text = text.replace(/^\s/, '');
    //remove trailing spaces on text
    text = text.replace(/\s$/g, '');


    var addyArray = address.split('.');


    // if we already have an item in the dictionary then we have collided with something already defined
    if(_.isString(combinedDictionary[address])) {

      // stop logging this at some point when we don't care about tracking variable re-use
      collisions[text] += address+',';

    } else {

      // if we haven't already set this
      // 2 ) perform a reverse mapL detect/report collisions
      if (_.isString(invertDictionary[text])) {

        // if we haven't defined this collision yet, let's begin with what we have in the inverted dictionary
        if (_.isUndefined(collisions[text])) {
          collisions[text] = invertDictionary[text] +',';
        }

        // collect all collisions
        collisions[text] += address+',';

        // 3) if it already exists use what we have in the dictionary
        combinedDictionary[address] = invertDictionary[text];

      } else {

        // no collision yet, let's save it in the inverted dictionary for future comparison
        invertDictionary[text] = address;

        // set the combined dictionary too
        combinedDictionary[address] = text;

      }
    }

    if (DEBUG) {
      console.log('Processing one pair ('+dataPairs[idx]+')');
      console.log(' idx:     ' + idx);
      console.log(' address: ' + address);
      console.log(' text:    ' + text);
      console.log(' dict = '+JSON.stringify(combinedDictionary));
    }

  }

  return combinedDictionary;

}

/*
 * flattenObj
 *  @param obj - JSON without array members
 *  @param prefix - used during recursion when a JSON member contains an object
 */

function flattenObj(obj, prefix) {
  var returnme = {};
  for (var key in obj) {
    if (!_.isObject(obj[key])) {
      var cobbledKey = (_.isString(prefix)) ? prefix + '.' + key : key;
      returnme[cobbledKey] = obj[key];
    } else {
      var cobbledKey = (_.isString(prefix)) ? prefix + '.' + key : key;
      var flattenedObject = flattenObj(obj[key], cobbledKey);
      for (var flatKey in flattenedObject) {
        returnme[flatKey] = flattenedObject[flatKey];
      }
    }
  }
  return returnme;
}

function loadCommonDictionary() {

  fs.readFile('common.json', function(err, data) {
    var fileData = data;

    jsonDictionary = JSON.parse(data);

    if (DEBUG) {
      console.log('[DEBUG] common dictionary loaded --> ' + JSON.stringify(jsonDictionary) );
    }

    if (err) {
      console.log('[ERROR]: missing dictionary');
    }

    // flatten the dictionary
    jsonDictionary = flattenObj(jsonDictionary);

    // create reverse dictionary [ value -> keys ]
    invertDictionary = _.invert(flattenObj(jsonDictionary));


    if (DEBUG) {
      console.log('[DEBUG] common dictionary flattened --> ' + JSON.stringify(jsonDictionary) );
      console.log('[DEBUG] common dictionary inverted --> ' + JSON.stringify(invertDictionary) );
    }

  });

}


loadCommonDictionary();

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

  (function(filePath, i, jsonDictionary) {

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

      // 3) get collisions
      if (DEBUG) {
        console.log('[DEBUG] Collisions = ' + JSON.stringify(collisions) );
      }

      if (DEBUG) {
        console.log('[DEBUG] Dictionary = ' + JSON.stringify(jsonDictionary) );
      }

      saveCollisions(collisions);
      saveDictionary(jsonDictionary);
    });

  })(filePath, i, jsonDictionary);
}



