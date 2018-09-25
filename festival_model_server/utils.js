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

const settings = require('./settings');

/**
 * Module containing util methods.
 */
const { MODEL_LOCAL_PATH, UNISON_NAME } = require('./constants');

/**
 * Returns a array containing phoneme and endtime fields.
 * Example - [{ phoneme: 'sil', endtime: 0.6278 }]
 * @param {String} festivalAlignment festival alignment string to be parsed.
 */
const getAlignmentData = (festivalAlignment) => {
  // The data is in the following pattern.
  // Example - id _22 ; name sil ; end 0.223152 ;
  try {
    const result = [];
    // Remove the alignment header and then the trailing newline.
    // eslint-disable-next-line no-param-reassign
    festivalAlignment = festivalAlignment
      .replace('()\n', '')
      .replace(/\n$/, '');
    const content = festivalAlignment.split('\n');

    for (let i = 0; i < content.length; i += 1) {
      const alignmentRegex = /name (.*) ; end (.*) ;/ig;

      const matches = alignmentRegex.exec(content[i]);

      if (!matches || matches.length !== 3) {
        throw new Error('malformed alignment data');
      }

      const phoneme = matches[1];
      const endtime = parseFloat(matches[2]);

      if (Number.isNaN(endtime)) {
        throw new Error('Invalid endtime');
      }

      result.push({
        phoneme,
        endtime,
      });
    }
    return result;
  } catch (e) {
    console.error(e);
    console.log(festivalAlignment);
    return [];
  }
};

/**
 * Returns a error message for the given parameters.
 * @param {String} err error from the exec call.
 * @param {String} stderr standard error from the exec call.
 */
const getExecErrorMessage = (err, stderr) => {
  let errMsg = null;
  if (err) {
    errMsg = `exec error: ${err}`;
  } else if (stderr.length > 0) {
    errMsg = `stderr: ${stderr.toString()}`;
  }
  return errMsg;
};

/**
 * Returns settings for the given voice.
 */
const getVoiceSettings = () => ({
  festvoxFile: `festvox/${UNISON_NAME}.scm`,
  voiceName: `voice_${UNISON_NAME}`,
  localFolder: MODEL_LOCAL_PATH,
});

/**
 * Returns the original string with characters
 * specified in settings replaced with spaces.
 * @text {String} text to be replaced.
 */
const replaceCharactersWithSpaces = (text) => {
  const re = new RegExp(`[${settings.CHARACTERS_TO_REPLACE_WITH_SPACES}]`, 'g');
  const newText = text.replace(re, ' ').trim();
  return newText;
};

module.exports = {
  getAlignmentData,
  getExecErrorMessage,
  getVoiceSettings,
  replaceCharactersWithSpaces,
};
