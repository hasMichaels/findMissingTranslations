var assert = require('assert');
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
