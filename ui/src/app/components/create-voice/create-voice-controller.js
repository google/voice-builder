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

import utils from '../../shared/utils';

/** The controller which is used to a create new voice. */
export default class CreateVoiceCtrl {
  /**
   * @param {!angular.$http} $http
   * @param {!angular.$httpParamSerializer} $httpParamSerializer
   * @param {!angular.$scope} $scope
   * @ngInject
   */
  constructor($http, $httpParamSerializer, $scope, toast) {
    /** @const @private {!angular.$http} */
    this.http_ = $http;
    /** @const @private {!angular.$httpParamSerializer} */
    this.httpParamSerializer_ = $httpParamSerializer;
    /** @const @private {!Object} */
    this.toast_ = toast;
    /** @export {boolean} */
    this.createVoiceBtnEnabled = true;
    // TODO(twattanavekin): Get the list from config instead of hard-coding here.
    /** @const @export {!Object} */
    this.ttsEngines = [];
    // TODO(twattanavekin): Migrate to JSPB to utilize dilscoop.proto to
    // represent VoiceExportSpecification in all field inputs.
    /** @export {!Object} */
    this.createVoiceModel = {
      voiceName: 'my_voice',
      createdBy: 'user1',
      lexicon: `${utils.CONSTANTS.DEFAULT_DATA_BASE_PATH}/lexicon.scm`,
      phonology: `${utils.CONSTANTS.DEFAULT_DATA_BASE_PATH}/phonology.json`,
      wavs: `${utils.CONSTANTS.DEFAULT_DATA_BASE_PATH}/wavs.tar.gz`,
      wavsInfo: `${utils.CONSTANTS.DEFAULT_DATA_BASE_PATH}/txt.done.data`,
      phonologyFileType: "",
      lexiconFileType: "",
      wavsFileType: "",
      wavsInfoFileType: "",
      sampleRate: '22050', // Preferred sample rate for festival.
      ttsEngine: {},
      cacheVoiceFeatures: false,
      selectedWavsSetId: 0, // Resource library caching entity id.
      pathToSaveCache: '',
      pathToLoadCache: '',
    };
    // Initialize available engines to the TTS Engine listbox.
    this.getAvailableEngines();
  }

  /** Gets a list of available TTS engines */
  getAvailableEngines() {
    this.http_.get('/api/tts_engines')
        .then(res => {
          this.ttsEngines = res.data;
          if (this.ttsEngines.length !== 0) {
            // Initialize the first one to the TTS Engine listbox.
            this.createVoiceModel.ttsEngine = this.ttsEngines[0];
            this.changeEngine();
          }
        });
  }

  /** Change engine and its parameters */
  changeEngine() {
    // Retrieve an engine config and format params in a 'key=value' format.
    this.http_.get(`/templates/engines/${this.createVoiceModel.ttsEngine.folderName}/engine.json`)
      .then(res => {
        this.createVoiceModel.ttsEngine.config = res.data;
        const engineConfig = this.createVoiceModel.ttsEngine.config;
        const rawParams = (engineConfig && engineConfig.params)? engineConfig.params: [];
        const formattedParams = rawParams.reduce((sum, param) =>
            `${param.key}=${param.value}\n${sum}`, '');
        this.createVoiceModel.ttsEngine.formattedParams = formattedParams.trim();
      });
  }

  /** Handles click to create a new voice. */
  createVoiceBtn() {
    this.createVoiceBtnEnabled = false;

    // TODO(pasindu): Add file location type fields in the form.
    const voiceSpec = {
      voice_name: this.createVoiceModel.voiceName,
      created_by: this.createVoiceModel.createdBy,
      engine_params: utils.formatEngineParamsToKeyValues(
          this.createVoiceModel.ttsEngine.formattedParams),
      sample_rate: this.createVoiceModel.sampleRate,
      tts_engine: this.createVoiceModel.ttsEngine.folderName,
      cache_voice_features: this.createVoiceModel.cacheVoiceFeatures,
      path_to_save_cache: {
        path: this.createVoiceModel.pathToSaveCache,
        resource_library_parent_id:
          parseFloat(this.createVoiceModel.selectedWavsSetId),
      },
      path_to_load_cache: {
        path: this.createVoiceModel.pathToLoadCache,
      },
      lexicon_path: {
        path: this.createVoiceModel.lexicon,
        file_type: this.createVoiceModel.lexiconFileType,
      },
      phonology_path: {
        path: this.createVoiceModel.phonology,
        file_type: this.createVoiceModel.phonologyFileType,
      },
      wavs_path: {
        path: this.createVoiceModel.wavs,
        file_type: this.createVoiceModel.wavsFileType,
      },
      wavs_info_path: {
        path: this.createVoiceModel.wavsInfo,
        file_type: this.createVoiceModel.wavsInfoFileType,
      },
    };
    // API request to create the voice.
    this.http_({
      method: 'POST',
      url: '/api/create_voice',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      data: voiceSpec,
    })
      .then((response) => {
        this.toast_(response.data.message);
        this.createVoiceBtnEnabled = true;
      })
      .catch((err) => {
        this.createVoiceBtnEnabled = true;
        this.toast_(`Status Code: ${err.status} - ${err.data}`, true);
      });
  }
}
