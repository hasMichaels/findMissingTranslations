/**
 * srchHtmlForText
 *
 * Scan a directory of partials and report what code has not been translated
 * Translated text shall rely on angular or other means to properly present text, this
 * means any remaining text is untranslated
 *
 * Workflow:
 *  0.) read through files in a directory
 *  1.) flatten file by removing newlines
 *  2.) remove static angular translations
 *  3.) remove HTML/XML code
 *  4.) reduce whitespace
 *  5.) remaining content are unassociated text that requires translation
 *
 */

var DEBUG = false;
var exampleUsage = 'example usage: node ./src/srchHtmlForText.js /tmp/testDirectory';

var myArgs = require('optimist').argv, help = exampleUsage;
var fs = require('fs');
var path = require('path');
var partialsPath = '/../test/testHtml';
var isDir = require('is-directory');
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

function oldreportUntranslatedText(file, data) {

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

// go through files
for (var i in files) {
  counter++;
  var filePath = path.join(directoryPath + files[i]);


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

  // skip orig files
  if (files[i].match(/\.orig/)) {
    console.log('[DEBUG - SKIPPING Translated]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    continue;
  }

  // skip hidden files
  if (files[i].match(/^\./)) {
    console.log('[DEBUG - SKIPPING hidden]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    continue;
  }

  // skip hidden files
  if (files[i].match(/\~$/)) {
    console.log('[DEBUG - SKIPPING tempfile]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    continue;
  }

  if (DEBUG) {
    console.log('[DEBUG]'+counter + ' of ' + files.length + ' files: ' + files[i]);
    console.log('[DEBUG]__dirname: ' + directoryPath);
    console.log('[DEBUG]_partials: ' + partialsPath);
  }

  (function(filePath, i) {

    // if a directory then skip
    if (isDir(directoryPath + partialsPath + '/' + files[i])) {

      console.log('[DEBUG - SKIPPING Directory]' + counter + ' of ' + files.length + ' dir: ' + directoryPath + files[i]);

    } else {

      fs.readFile(directoryPath + partialsPath + '/' + files[i], function(err, data) {
        var fileData = data;
        var fileName = i + ' : ' + filePath + '/';
        if (err) throw err;
        if (DEBUG) {
          console.log('[DEBUG] File Content:' + data);
        }
        universalTranslator.reportUntranslatedText(fileName, fileData);
      });

    }
  })(filePath, i);
}
