'use strict';

var assert = require('assert');
//var translationObj = require('../src/srchHtmlForTextAndCreateTranslationMap');

describe('Can we find necessary translations.', function () {
  it('should return `true` if the path is a directory', function () {
    assert(!isThereTranslations('testHtml/allTranslated.html'));
    assert(isThereTranslations('testHtml/missingSomeTranslations.html'));
  });
});


describe('translation workflow creates dict and translated files', function () {
  it('should return `true` if the path is a directory', function () {
    assert(isTranslationFiles('testHtml/allTranslated.html'));
    assert(isTranslationFiles('testHtml/missingSomeTranslations.html'));
  });
});