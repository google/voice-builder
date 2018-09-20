// Copyright 2018 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const utils = require('../utils');

describe('Testing utils replaceCharactersWithSpaces method', () => {
  it('The function should return characters replaced with spaces and trim', () => {
    const testData = [
      ['`<text>`', 'text'],
      ['`text`', 'text'],
      ['$(text)', 'text'],
      ['"\$(text\)', 'text'],
      ['\"\$(text\)', 'text'],
      ['${{{text}', 'text'],
      ['\$\{text\}', 'text'],
      ['\${text"}', 'text'],
      ['"${{text"}', 'text'],
      ['"${text"}', 'text'],
      ["\"ශ්රී ලංකාව'\"", 'ශ්රී ලංකාව'],
      ['"$text"', 'text'],
      ['$text', 'text'],
      [",./;'[]*\-=", ''],
      ['echo `<text>`', 'echo   text'],
      ['echo $("text")', 'echo    text'],
      ['echo \$\{text\}', 'echo   text'],
    ];

    testData.forEach(function(entry) {
      expect(utils.replaceCharactersWithSpaces(entry[0])).toEqual(entry[1]);
    });
  });
});
