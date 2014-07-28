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

var DEBUG = true;
var exampleUsage = 'example usage: node srchAndTranslate.js /tmp/testDirectory';

var myArgs = require('optimist').usage(exampleUsage).argv;
var fs = require('fs');
var path = require('path');
var isDir = require('is-directory');
var partialsPath = '/../test/testHtml';
var directoryPath = __dirname;
var universalTranslator = require('./fnLostInTranslation');

if (myArgs._[0]) {
  console.log('...  processing path to scan :' + myArgs._[0]);
  directoryPath = '';             // use args path instead of this directory
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

universalTranslator.loadCommonDictionary();

// go through files and create dictionary mappings and translations
for (var i in files) {
  counter++;

  // todo: modify the list to remove files that we don't want to visit

  var filePath = path.join(directoryPath + files[i]);
  var fullPath = directoryPath + partialsPath + '/' + files[i];

  if (DEBUG) {
    console.log('[DEBUG]' + counter + ' of ' + files.length + ' files: ' + files[i]);
    console.log('[DEBUG] current directory if no directory specified : ' + directoryPath);
    console.log('[DEBUG] directory to run translation: ' + partialsPath);
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

  // skip directories
  if (isDir(directoryPath + partialsPath + '/' + files[i])) {
    console.log('[DEBUG - SKIPPING Directory]' + counter + ' of ' +
    files.length + ' dir: ' + directoryPath + files[i]);
    continue;
  }

  universalTranslator.createTranslationAndDictionary(filePath, fullPath, files[i], i);
}
