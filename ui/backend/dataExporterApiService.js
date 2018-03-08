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

const axios = require('axios');

const config = require('./config');
const constants = require('./constants');

const buildDataExporterUrl = (endPoint) =>
  `${config.DATA_EXPORTER_API.BASE_URL + endPoint}?key=${config.DATA_EXPORTER_API.API_KEY}`;

const copyResource = (sourcePath, targetPath) => {
  const options = {
    url: buildDataExporterUrl(constants.DATA_EXPORTER_API.COPY_RESOURCE),
    method: 'POST',
    data: {
      source_path: sourcePath,
      target_path: targetPath,
    },
  };
  return axios(options);
};

const createVoice = (voiceSpec) => {
  const options = {
    url: buildDataExporterUrl(constants.DATA_EXPORTER_API.CREATE_VOICE),
    method: 'POST',
    data: {
      voice_building_specification: voiceSpec,
    },
  };
  return axios(options);
};

module.exports = {
  copyResource,
  createVoice,
};
