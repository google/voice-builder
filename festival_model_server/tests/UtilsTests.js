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

describe('Testing utils getAlignmentData method', () => {
  const generateTestData = () => {
    let testContent = '()\n'; // Alignment data starts with this.
    const expectedContent = [];
    for (let i = 0; i < 20; i += 1) {
      const randomData = Math.random();
      const phoneme = randomData.toString();
      const endtime = randomData;
      expectedContent.push({
        phoneme,
        endtime,
      });
      testContent += `id_${i} ; name ${phoneme} ; end ${endtime} ;\n`;
    }
    return { testContent, expectedContent };
  };

  beforeEach(() => {
    spyOn(console, 'error');
  });

  it('The function should return valid data', () => {
    const testData = generateTestData();

    expect(utils.getAlignmentData(testData.testContent)).toEqual(testData.expectedContent);
  });

  it('The function should return empty array when invalid data is given', () => {
    expect(utils.getAlignmentData('id _22 ; name sil ;')).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(new Error('malformed alignment data'));
  });
});
