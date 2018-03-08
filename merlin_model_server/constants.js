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
  // TODO(pasindu): Change this to /usr/local/src/ when data can
  // be compressed without the path prefix.
  MODEL_LOCAL_PATH: '/',
  // The following is not template string in javascript but for bash cmdline.
  /* eslint-disable no-template-curly-in-string */
  SYNTH_SCRIPT: '${SYNTH_SCRIPT}',
  PROD: 'production',
};
module.exports = Constants;
