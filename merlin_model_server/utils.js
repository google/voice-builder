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
  getExecErrorMessage,
  replaceCharactersWithSpaces,
};
