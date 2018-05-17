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

/**
 * @fileoverview Common utility and helper methods.
 */

/**
 * Constants are variables shared by controllers and directives.
 */
const CONSTANTS = {
  // Used to indicate that the user wants to cache features.
  ENABLE_SAVE_FEATURES_KEY: 'ENABLE_SAVE_FEATURES',
  // Used to indicate that the user wants to load features.
  ENABLE_LOAD_CACHED_FEATURES_KEY: 'ENABLE_LOAD_CACHED_FEATURES',
  // Default location where example data is stored.
  DEFAULT_DATA_BASE_PATH: 'gs://voice-builder-public-data/examples/sinhala',
};


/**
 * Reformat engine params into [{key: "", value: ""}, ...] format..
 */
function formatEngineParamsToKeyValues(engineParams) {
  return engineParams.split('\n').reduce((array, str) => {
    const splitStr = str.split('=');
    if (splitStr.length !== 2) {
      console.log(`${str} is not in the correct format (key=value)`);
      return array;
    }
    return [...array, {key: splitStr[0], value: splitStr[1]}];
  }, []);
}

/** @const */
module.exports = {
  CONSTANTS,
  formatEngineParamsToKeyValues,
};
