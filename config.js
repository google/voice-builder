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
 * Module containing all the configs.
 */
const config = {
  PROJECT_ID: '<PROJECT_ID>',
  GCP_SERVICE_ACCOUNT_EMAIL: '<GCP_SERVICE_ACCOUNT_EMAIL>',
  ZONE: '<ZONE>',
  GCS: {
    JOB_BUCKET: '<JOB_BUCKET_NAME>',
  },
  TTS_ENGINES: [
    {
      name: 'festival',
      folderName: 'festival',
    },
    {
      name: 'merlin',
      folderName: 'merlin',
    },
  ],
};
module.exports = config;
