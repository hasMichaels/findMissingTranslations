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

function reportUntranslatedText(file, data) {

  var returnMe = 'no content';
  var onlyText = "" + data; //stringify
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

function createTranslationMap(filename, csvMissing) {
  // split missing strings into array
  var missingTextAry = csvMissing.split(",");

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
          !missingTextAry[i].match(/\w/)) {
        // Space: the final frontier.
      } else {

        // the name of the static translation token is lowercase
        var name = missingTextAry[i].toLowerCase();

        // the name of the static translation token has no spaces
        name = name.replace(/\s+/g, '');

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

  for (var staticTranslation in translationObj) {
    if (translationObj.hasOwnProperty(staticTranslation)) {

      // let commandline know what is going to be replaced
      console.log('[createTranslatedFile] search through ['+filename+']'+
      'replace All ['+translationObj[staticTranslation]+'] with ['+staticTranslation+']');

      // replace text with token in the new file
      var token = '<% '+staticTranslation + ' %>';
      console.log ('TOKEN'+token);
      var replaceThis = new RegExp( translationObj[staticTranslation], 'g');
      newFileContents = newFileContents.replace( replaceThis, token);

      // store off the new dictionary translation
      newDictionaryContents += '"' + staticTranslation + '" : "' + translationObj[staticTranslation] +'", ' +'\n';

      console.log('replaceThis:'+replaceThis);
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
