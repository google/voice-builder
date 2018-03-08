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
 * Module containing all the constants.
 */
const Constants = {
  DEFAULT_PORT: 8080,
  // The following is not template string in javascript but for bash cmdline.
  /* eslint-disable no-template-curly-in-string */
  FESTIVAL_BIN: '${FESTIVALDIR}/bin/festival',
  TEXT_TO_WAV_BIN: '${FESTIVALDIR}/bin/text2wave',
  /* eslint-enable no-template-curly-in-string */
  MODEL_LOCAL_PATH: '/home/model',
  PROD: 'production',
  UNISON_NAME: 'goog_vb_unison_cg',
};
module.exports = Constants;
