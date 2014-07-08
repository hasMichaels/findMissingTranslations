/**
 * srchHtmlForTextAndCreateTranslationMap
 *
 * Scan a directory of partials and report what code has not been translated.
 * Create a set of .translated files with static translations in place of static text
 *
 * Workflow:
 *  0.) read through files in a directory
 *  1.) flatten file by removing newlines
 *  2.) remove static angular translations
 *  3.) remove HTML/XML code
 *  4.) reduce whitespace
 *  5.) remaining content are unassociated text that requires translation
 *  6.) use this to createTranslationMap()
 *  7.) construct static translations and createTranslatedFile()
 *
 */

var DEBUG = false;
var TOKENSEPARATOR = '_';
var exampleUsage = 'example usage: node ./src/srchHtmlForTextAndCreateTranslationMap.js /tmp/testDirectory';

var myArgs = require('optimist').argv, help = exampleUsage;
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

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
    return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
}

function reportUntranslatedText(file, data) {

  var returnMe = 'no content';
  var onlyText = "" + data; //stringify
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

function createTranslationMap(filename, csvMissing) {

  // split missing strings into array
  var missingTextAry = csvMissing.split(TOKENSEPARATOR);

  // determine prefix based on filename
  var prefix = filename;
  prefix = prefix.replace(/.html/g, '');
  prefix = prefix + '.label.';

  var translationMap = {};

  // construct translation map
  for (var i = 0; i < missingTextAry.length; i++) {

      // If there is a missing translation then create a mapping to a static identifier
      if (missingTextAry[i] === '' ||
          missingTextAry[i] === ' ' ||
          !missingTextAry[i].match(/\w/) ||
          missingTextAry[i].length === 1 ||
          missingTextAry[i].match(/\s*x\s*/)) {
        // Let's ignore translating the following:
        // - Space: (the final frontier).
        // - One Character: (x is the most popular static translation)
      } else {

        // the name of the static translation token is lowercase
        var name = missingTextAry[i].toLowerCase();

        // the name of the static translation token has no spaces
        //name = name.replace(/\s+/g, '');
        name = camelize(name);

        // the name of the static translation token has no ugly chars
        name = name.replace(/[\#\!\@\$\%\&\*\^\(\)\/\\]/g, '');

        // remove trailing spaces from translation text
        missingTextAry[i] = missingTextAry[i].replace(/\s$/g, '');

        // create map
        translationMap[prefix + name] = missingTextAry[i];
      }
  }

  console.log('Translation MAP [-------');
  console.log('Translation Map : [' + filename + '] = ' + JSON.stringify(translationMap));
  console.log('Translation MAP -------]');

  return translationMap;
}

function createTranslatedFile(filename, translationObj, fileContents) {

  var newFileContents = ""+fileContents;
  var newDictionaryContents = "";

  // order the dictionary based on size
  // sort an array of users ascending by length of name
  sortByLength = function(array){
    return _.sortBy(array,function(element){
      return element.name.length || 0;
    });
  }
  var keyArray = Object.keys(translationObj);
  var sortedKeys = _.sortBy(keyArray,function(str){ return str.length; });
      sortedKeys = sortedKeys.reverse();



  /* Proceed with replacing text based on the passed-in dictionary.
   * Instead of going through each of the keys out of order
   * like so: for (var staticTranslation in translationObj) {
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
      // if the length of the thing we are replacing is long and has a newline, truncate it
      if (thingToReplace.length > 42) {
        var Beginning = thingToReplace.substring(0,20).replace(/\W/g,'.');
        var End = thingToReplace.substring(thingToReplace.length-20,thingToReplace.length-1).replace(/\W/g,'.');
        thingToReplace = Beginning +'(.|[\r\n])*' + End;
      }
      var thingToReplaceWithinBrackets = '>[\s\n\r]*?' + thingToReplace + '[\s\n\r]*?<';
      console.log('[createTranslatedFile] TOKEN:\t' + tokenWithBrackets);
      console.log('[createTranslatedFile] thingToReplace::\t[' + thingToReplaceWithinBrackets +']');


      // perform the replace
      var replaceThis = new RegExp(thingToReplaceWithinBrackets, 'gm');
      newFileContents = newFileContents.replace(replaceThis, tokenWithBrackets);

      // store off the new dictionary translation
      newDictionaryContents += '"' + staticTranslation + '" : "' + translationObj[staticTranslation] + '", ' + '\n';

      console.log('replaceThis:' + replaceThis);
    }
  }

  console.log('blah:'+newFileContents);

  // save .translation file
  fs.writeFile (filename, newFileContents, function(err) {
    if(err) {
      console.log("SAVE FAILURE [" + filename + "] was saved!"+err);
    } else {
      console.log("SAVE Success [" + filename + "] was saved!");
    }
  });

  // save .dict file
  var dictFilename = filename.replace(/translated/g, 'dict');
  fs.writeFile (dictFilename, newDictionaryContents, function(err) {
    if(err) {
      console.log("SAVE FAILURE [" + dictFilename + "] was saved!"+err);
    } else {
      console.log("SAVE Success [" + dictFilename + "] was saved!");
    }
  });
}

// go through files
for (var i in files) {
  counter++;
  var filePath = path.join(directoryPath + files[i]);
  if (DEBUG) {
    console.log('[DEBUG]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    console.log('[DEBUG]__dirname: ' + directoryPath);
    console.log('[DEBUG]_partials: ' + partialsPath);
  }

  // skip translated files
  if (files[i].match(/\.translated/)) {
    console.log('[DEBUG - SKIPPING Translated]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    continue;
  }

  // skip dictionary files
  if (files[i].match(/\.dict/)) {
    console.log('[DEBUG - SKIPPING Translated]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    continue;
  }

  // skip hidden files
  if (files[i].match(/^\./)) {
    console.log('[DEBUG - SKIPPING hidden]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    continue;
  }

  (function(filePath, i) {
    var csvStrings, translationMap;

    fs.readFile(directoryPath + partialsPath + '/' + files[i], function(err, data) {
      var fileData = data;
      var fileName = i + ' : ' + filePath + '/';
      if (err) {
        console.log ( 'ERROR in file read loop @ '+fileName);
        throw err;
      }
      if (DEBUG) {
        console.log('[DEBUG] File Content:' + data);
      }
      csvStrings = reportUntranslatedText(fileName, fileData);
      translationMap = createTranslationMap(files[i], csvStrings);
      createTranslatedFile(directoryPath + partialsPath + '/' + files[i] + '.translated', translationMap, data);
    });


  })(filePath, i);
}
