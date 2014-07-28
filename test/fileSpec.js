var testCase = require('mocha').describe;
var pre = require('mocha').before;
var assertions = require('mocha').assertions;
var assert = require('assert');
var describe = require('describe');
var translationObj = require('../module/fnLostInTranslation');

suite('File tests', function(){

  console.log('running file tests');
  suite('generated files', function(){
    test('should be true when files are present', function(){
      assert.equal(translationObj.isThereTranslationFiles('../testHtml'), true);
      assert.equal(translationObj.isThereDictionaryFiles('../testHtml'), true);
    });
  });
});
