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
 * Module containing settings for merlin server.
 */
const settings = {
  // Merlin synthesis pipeline might not handle these characters as expected
  // and also they are typically not needed during tts synthesis.
  // Therefore we replace them with spaces.
  CHARACTERS_TO_REPLACE_WITH_SPACES: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
};
module.exports = settings;
