var assert = require('assert');
var translationObj = require('../module/fnLostInTranslation');

suite('File tests', function(){

  console.log('running file tests');
  suite('generated files', function(){
    test('should be true when files are present .translation files', function(){
      assert.equal(translationObj.isThereTranslationFiles('test/testHtml'), true);
    });
    test('should be true when files are present .dict files', function(){
      assert.equal(translationObj.isThereDictionaryFiles('test/testHtml'), true);
    });

  });
});
