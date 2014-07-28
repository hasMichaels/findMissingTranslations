var testCase = require('mocha').describe;
var pre = require('mocha').before;
var assertions = require('mocha').assertions;
var assert = require('assert');
var translationObj = require('../module/fnLostInTranslation');

suite('Are There Translations', function(){

  console.log('running file tests');
  suite('generated files', function(){
    test('should return -1 when not present', function(){
      assert.equal(translationObj.isThereTranslations('testHtml/allTranslated.html'), false);
      assert.equal(translationObj.isThereTranslations('testHtml/missingSomeTranslations.html'), true);
    });
  });
});
