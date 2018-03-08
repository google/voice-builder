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
  // The kind for the new entity
  NESTED_RESOURCE_KIND: 'NestedResource',
  AUDIO_RESOUCE_KIND: 'AudioResource',
  DEFAULT_PORT: 3000,
  TEMP_DEFAULT_EMAIL_ACCOUNT: 'noname@somemail.com',
  DIST_DIR: 'dist',
  PROD: 'production',
  GCP_SCOPE: ['https://www.googleapis.com/auth/cloud-platform'],
  WAV_RESOURCE_FOLDER: '/wav/wavs.tar',
  GCS: {
    MODEL_SERVER_SPEC_FILENAME: 'modelServerSpec.json',
    JOB_COUNTER_FILE: 'appData/jobCounter.txt',
    PIPELINE_CREATE_REQUEST_FILENAME: 'pipelineCreateRequest.json',
    PIPELINE_RUN_REQUEST_FILENAME: 'pipelineRunRequest.json',
    VOICE_SPEC_FILENAME: 'voiceSpec.json',
    PIPELINE_INFO_FILENAME: 'pipelineInfo.json',
  },
  DATA_EXPORTER_API: {
    CREATE_VOICE: 'create_voice',
    COPY_RESOURCE: 'copy_resource',
  },
};
module.exports = Constants;
