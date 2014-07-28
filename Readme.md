# Wiki
- Workflow + Algs : https://github.com/hasMichaels/findMissingTranslations/wiki

# ./src vs ./module
- ./src/* scripts grew out of necessity and reused a lot of simlar code
- ./module/* scripts have the common portions pulled into fnLostInTranslation.js


# src/srchHtmlForTexts || module/srchHtmlForTexts

  tiny script for clearing away html, angular, and custom tags to reveal text that need to be translated

## Usage

- npm install
- node ./src/srchHtmlForText.js
- node ./src/srchHtmlForText.js `Directory` 

## Example Output

    $ node ./src/srchHtmlForText.js 
    searching for files in:/Users/michaels/github/findMissingTranslations/src/../test/testHtml
    
    missing translations (file: 0 : /Users/michaels/github/findMissingTranslations/src...
    allTranslated.html/ :: Untranslated Set(( ))
    
    missing translations (file: 1 : /Users/michaels/github/findMissingTranslations/src...
    missingSomeTranslation.html/ :: Untranslated Set(( untranslated 0 of 4 ...
    untranslated 1 of 4 untranslated 2 of 4 untranslated 3 of 4 untranslated 4 of 4 ))



# src/srchHtmlForTextAndCreateTranslationMap || module/srchAndTranslate

  find partials, create translation mapping

## Usage

- npm install
- node ./src/srchHtmlForTextAndCreateTranslationMap.js
- node ./src/srchHtmlForTextAndCreateTranslationMap.js `Directory` 

## Artifacts
- .dict : dictionary file with key - translation mapping 
- .translation : partial with new translation keys


# src/srchAndConsolidateDictFiles || module/srchAndConsolidateDictFiles

  find .dict artifacts, consolidates translations into a .json file

## Usage

- npm install
- node ./src/srchAndConsolidateDictFiles.js
- node ./src/srchAndConsolidateDictFiles.js `Directory` 

## Artifacts
- .dictionary.json : dictionary file in json
