module.exports = function() {

  // To DEBUG or not to DEBUG
  if ( typeof DEBUG === 'undefined' ) {
    var DEBUG = false;
  }

  // Important vars related to translation mapping
  var TOKENSEPARATOR = '_';
  var jsonDictionary = {};
  var invertDictionary = {};
  var exampleUsage = 'example usage: node ./src/srchHtmlForTextAndCreateTranslationMap.js /tmp/testDirectory';

  var myArgs = require('optimist').argv;
  var fs = require('fs');
  var path = require('path');
  var isDir = require('is-directory');
  var partialsPath = '/../test/testHtml';
  var directoryPath = __dirname;
  var _ = require('underscore');
  var counter = 0;

  function reportUntranslatedTextfunction(file, data) {

    'use strict';

    var returnMe = 'no content';
    var onlyText = '' + data; //stringify
    onlyText = onlyText.replace(/[\n\r]/g, ' ');

    // remove translations
    onlyText = onlyText.replace(/\<\%.+?\%\>/g, '');
    // remove angular content
    onlyText = onlyText.replace(/\{\{.+?\}\}/g, '');
    // remove xml/html tags
    onlyText = onlyText.replace(/<\/.*?>/g, ',');
    onlyText = onlyText.replace(/<.*?>/g, '');

    /* At this point we have a file with a lot of commas that delimit each of the xml elements and a lot of
     * spaces related to flattening the file and removing newlines. */

    // prettify filtered text, remove extra spaces and commas
    returnMe = onlyText;
    returnMe = returnMe.replace(/\s+/g, ' ');  // remove multiple spaces
    returnMe = returnMe.replace(/,\s*/g, ','); // remove comma space
    returnMe = returnMe.replace(/,+/g, ',');   // remove sequential commas


    // log file and untranslated text
    console.log('missing translations (file: ' + file + ' :: Untranslated Set((' + returnMe + '))');

    return returnMe;
  }

  /*
   * flattenObj
   *  @param obj - JSON without array members
   *  @param prefix - used during recursion when a JSON member contains an object
   *  @todo Add this to a common module
   */
  function flattenObj(obj, prefix) {
    'use strict';

    var returnme = {};
    for (var key in obj) {
      var cobbledKey = '';
      if (!_.isObject(obj[key])) {
        cobbledKey = (_.isString(prefix)) ? prefix + '.' + key : key;
        returnme[cobbledKey] = obj[key];
      } else {
        cobbledKey = (_.isString(prefix)) ? prefix + '.' + key : key;
        var flattenedObject = flattenObj(obj[key], cobbledKey);
        for (var flatKey in flattenedObject) {
          returnme[flatKey] = flattenedObject[flatKey];
        }
      }
    }
    return returnme;
  }

  function loadCommonDictionary() {

    'use strict';

    fs.readFile('common.json', function(err, data) {

      jsonDictionary = JSON.parse(data);

      if (DEBUG) {
        console.log('[DEBUG] common dictionary loaded --> ' + JSON.stringify(jsonDictionary));
      }

      if (err) {
        console.log('[ERROR]: missing dictionary');
      }

      // flatten the dictionary
      jsonDictionary = flattenObj(jsonDictionary);

      // create reverse dictionary [ value -> keys ]
      invertDictionary = _.invert(flattenObj(jsonDictionary));


      if (DEBUG) {
        console.log('[DEBUG] common dictionary flattened --> ' + JSON.stringify(jsonDictionary));
        console.log('[DEBUG] common dictionary inverted --> ' + JSON.stringify(invertDictionary));
      }

    });

  }

  function reportUntranslatedText(file, data) {

    'use strict';

    var returnMe;
    var onlyText = '' + data; //stringify
    onlyText = onlyText.replace(/[\n\r]/g, ' ');

    // remove translations
    onlyText = onlyText.replace(/\<\%.+?\%\>/g, '');
    // remove angular content
    onlyText = onlyText.replace(/\{\{.+?\}\}/g, '');
    // remove xml/html tags
    onlyText = onlyText.replace(/<\/.*?>/g, TOKENSEPARATOR);
    onlyText = onlyText.replace(/<.*?>/g, '');

    /* At this point we have a file with a lot of commas that delimit each of the xml elements and a lot of
     * spaces related to flattening the file and removing newlines. */

    // prettify filtered text, remove extra spaces and commas
    returnMe = onlyText;
    returnMe = returnMe.replace(/\s+/g, ' ');  // remove multiple spaces
    var delimiterSpace = '[\ ]*' + TOKENSEPARATOR+'[\ ]*';
    var delimiterSpaceRegexp = new RegExp(delimiterSpace,'g');
    returnMe = returnMe.replace(delimiterSpaceRegexp, TOKENSEPARATOR); // remove comma space
    var sequential = TOKENSEPARATOR+'+';
    var sequentialRegexp = new RegExp(sequential,'g');
    returnMe = returnMe.replace(sequentialRegexp, TOKENSEPARATOR);   // remove sequential commas


    // log file and untranslated text
    console.log('missing translations (file: ' + file + ' :: Untranslated Set((' + returnMe + '))');

    return returnMe;
  }

  function camelize(str) {
    'use strict';
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
      return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
    }).replace(/\s+/g, '');
  }

  function createTranslationMap(filename, csvMissing) {

    'use strict';

    // split missing strings into array
    var missingTextAry = csvMissing.split(TOKENSEPARATOR);

    // determine prefix based on filename
    var prefix = filename;
    prefix = prefix.replace(/.html/g, '');
    prefix = prefix + '.labels.';

    var translationMap = {};

    // construct translation map
    for (var i = 0; i < missingTextAry.length; i++) {

      // If there is a missing translation then create a mapping to a static identifier
      // Let's ignore translating the following:
      // - Space: (Doesn't require translation).
      // - One Character: (No need to translate one char, x is the most popular static one char translation)
      if (!(missingTextAry[i] === '' ||
        missingTextAry[i] === ' ' || !missingTextAry[i].match(/\w/) ||
        missingTextAry[i].replace(/^\s*/).length === 1 ||
        missingTextAry[i].length === 1 ||
        missingTextAry[i].match(/^\s*x\s*/))) {


        // the name of the static translation token is lowercase
        var name = missingTextAry[i].toLowerCase();

        // the name of the static translation token has no spaces
        //name = name.replace(/\s+/g, '');
        name = camelize(name);

        // the name of the static translation token has no ugly chars
        name = name.replace(/[\#\!\@\$\%\&\*\^\(\)\/\\\.\,\'\-]/g, '');

        // remove trailing spaces from translation text
        missingTextAry[i] = missingTextAry[i].replace(/\s$/g, '');

        /* If we already have a translation for this in the common dictionary set the translation map to be
         be the common dictionary
         */
        if (_.isString(invertDictionary[missingTextAry[i]])) {

          // reuse existing definition
          translationMap[invertDictionary[missingTextAry[i]]] = missingTextAry[i];

        } else {

          // create new map
          translationMap[prefix + name] = missingTextAry[i];

          // update invert dictionary
          invertDictionary[missingTextAry[i]] = prefix + name;

        }

      }
    }

    console.log('Translation MAP [-------');
    console.log('Translation Map : [' + filename + '] = ' + JSON.stringify(translationMap));
    console.log('Translation MAP -------]');

    return translationMap;
  }

  function createTranslatedFile(filename, translationObj, fileContents) {

    'use strict';

    var newFileContents = ''+fileContents;
    var newDictionaryContents = '';

    /* Important reordering to allow for length based translation replacement:
     *  - order the dictionary based on size
     *  - sort an array of users ascending by length of name
     */
    var keyArray = Object.keys(translationObj);
    var sortedKeys = _.sortBy(keyArray,function(str){ return str.length; });
    sortedKeys = sortedKeys.reverse();

    /* Proceed with replacing text based on the passed-in dictionary.
     * Instead of going through each of the keys out of order
     * like so: for (var staticTranslation in translationObj) { ...,
     * we need to start with the largest keys first so we use our reverse sorted keys.
     * This way we don't accidentally replace portions of larger pieces of text.
     * There is still a possibility that competing translations of the same length will interact if they're
     * not unique (should not occur).
     */
    for (var idx in sortedKeys) {
      var staticTranslation = sortedKeys[idx];
      if (translationObj.hasOwnProperty(staticTranslation)) {

        // let commandline know what is going to be replaced
        console.log('[createTranslatedFile] search through [' + filename + ']' +
        'replace All [' + translationObj[staticTranslation] + '] with [' + staticTranslation + ']');

        // decide on what we're replacing
        var token = '<% ' + staticTranslation + ' %>';
        var tokenWithBrackets = '>' + token + '<';
        var thingToReplace = translationObj[staticTranslation];
        // if thingToReplace contains specialchars replace them
        thingToReplace = thingToReplace.replace('(\|(\))','.');
        // if the length of the thing we are replacing is long and has a newline, tclear
        // truncate it
        /*if (thingToReplace.length > 70) {
         var Beginning = thingToReplace.substring(0,20).replace(/\W/g,'.');
         var End = thingToReplace.substring(thingToReplace.length-20,thingToReplace.length-1).replace(/\W/g,'.');
         thingToReplace = Beginning +'(.|[\r\n])*' + End;
         !!
         }*/

        // spaces can be spaces or newlines, represent that here
        thingToReplace = thingToReplace.replace(/\s/g,'(\\s|\\n)*?');
        thingToReplace = thingToReplace.replace(/\*\?\*/g, '*?');

        var thingToReplaceWithinBrackets = '>(\\s|\\n)*' + thingToReplace + '(\\s|\\n)*<*';
        console.log('[createTranslatedFile] TOKEN:\t' + tokenWithBrackets);
        console.log('[createTranslatedFile] thingToReplace::\t[' + thingToReplaceWithinBrackets +']');

        // perform the replace
        var replaceThis = new RegExp(thingToReplaceWithinBrackets, 'gm');
        newFileContents = newFileContents.replace(replaceThis, tokenWithBrackets);

        // store off the new dictionary translation
        newDictionaryContents += '"' + staticTranslation + '" : "' +
        translationObj[staticTranslation] + '", ' + '\n';

        console.log('replaceThis:' + replaceThis);
      }
    }

    console.log('blah:'+newFileContents);

    // save .translation file
    fs.writeFile (filename, newFileContents, function(err) {
      if(err) {
        console.log('SAVE FAILURE [' + filename + '] was saved!'+err);
      } else {
        console.log('SAVE Success [' + filename + '] was saved!');
      }
    });

    // save .dict file
    var dictFilename = filename.replace(/translated/g, 'dict');
    fs.writeFile (dictFilename, newDictionaryContents, function(err) {
      if(err) {
        console.log('SAVE FAILURE [' + dictFilename + '] was saved!'+err);
      } else {
        console.log('SAVE Success [' + dictFilename + '] was saved!');
      }
    });
  }

  function createTranslationAndDictionary(filePath, fullPath, file, i) {

    'use strict';

    var csvStrings, translationMap;

    // if a directory then skip
    if (isDir(fullPath)) {

      console.log('[DEBUG - SKIPPING Directory]' + fullPath);

    } else {

      fs.readFile(fullPath, function(err, data) {
        var fileData = data;
        var fileName = i + ' : ' + filePath + '/';
        if (err) {
          console.log('ERROR in file read loop @ ' + fileName);
          throw err;
        }
        if (DEBUG) {
          console.log('[DEBUG] File Content:' + data);
        }
        csvStrings = reportUntranslatedText(fileName, fileData);
        translationMap = createTranslationMap(file, csvStrings);
        createTranslatedFile(fullPath + '.translated', translationMap, data);
      });

    }

  }

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

  function readFileAndUpdateDictionary(directoryPath, filePath, partialsPath, file, i, jsonDictionary) {

    'use strict';

    fs.readFile(directoryPath + partialsPath + '/' + file, function(err, data) {
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

  return {
      createTranslationAndDictionary : createTranslationAndDictionary,
      loadCommonDictionary : loadCommonDictionary,
      reportUntranslatedText : reportUntranslatedText,
      readFileAndUpdateDictionary : readFileAndUpdateDictionary
  };

}();