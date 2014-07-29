var testCase = require('mocha').describe;
var pre = require('mocha').before;
var assertions = require('mocha').assertions;
var assert = require('assert');
var translationObj = require('../module/fnLostInTranslation');

// Run translation proggie
var exec = require('child_process').exec;
var proggie = 'node ../module/srchAndTranslate.js ../test/testHtml';
exec(proggie, function (error, stdout, stderr) {
  console.log('ran:'+proggie);
});

suite('Are There Translations', function(){
  console.log('running file tests');
  suite('generated files', function(){
    test('should return -1 when not present', function(){
      assert.equal(translationObj.isThereTranslationOf('testHtml/allTranslated.html'), true);
      assert.equal(translationObj.isThereTranslationOf('testHtml/missingSomeTranslations.html'), true);
    });
  });
});
