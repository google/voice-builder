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

import { CONSTANTS } from '../../shared/utils';
/** Controller which presents all details of the given job. */
export default class JobDetailsCtrl {
  /**
   * @param {!angular.$http} $http
   * @param {!angular.$routeParams} $routeParams
   * @param {!angular.$sce} $sce
   * @ngInject
   */
  constructor($http, $routeParams, $sce) {
    /** @const @private {!angular.$http} */
    this.http_ = $http;
    /** @const @private {!angular.$sce} */
    this.sce_ = $sce;
    /** @export {!Object} */
    this.job = {};
    /** @export {!Object} */
    this.logFiles = {};
    /** @export {!string} */
    this.ttsText = '';
    /** @export {!boolean} */
    this.isMultiLine = false;
    /** @export {!boolean} */
    this.showSpectrogram = false;
    /** @export {!Array<!Object>} */
    this.synthsDetails = [];

    // Handles tab clicks.
    angular.element('.nav-tabs a').click((e) => {
      e.preventDefault();
      $(e.currentTarget).tab('show');
    });

    this.getJobInfo_($routeParams.jobId);
  }

  /**
   * Get voice building job information.
   * @param {!string} jobId Voice building job id.
   * @private
   */
  getJobInfo_(jobId) {
    this.http_.get(`/api/job/${jobId}`).then((response) => {
      const job = response.data;

      if (!job) {
        return;
      }

      this.job = job;
      this.job.timeCreated = new Date(job.voiceExportStartTime).toLocaleString();
      this.prettyPrintJob = JSON.stringify(job, null, 2);
    });
  }

  /**
   * Generate parameters for voice synthesis.
   * This method will build the synthesize text by replacing all the newline characters to spaces,
   * and use that text to construct an URL to request voice data from model server.
   */
  getDetails(jobId, text) {
    const urlText = text.replace(/\n/g, ' ');
    return {
      data: this.sce_.trustAsResourceUrl(
        `api/job/${jobId}/model_server/tts?text=${urlText}`),
      text
    };
  }

  /** Generate audio from provided tts text in template input */
  synthesizeAudio() {
    const textArray = this.isMultiLine ? this.ttsText.split(/\n/) : [this.ttsText];
    this.synthsDetails = textArray.map((text) => (this.getDetails(this.job.id, text)));
  }

  deployModelServer() {
    console.log('Send request to backend to deploy model');
    this.http_.get(`/api/job/${this.job.id}/deploy_model`).then((response) => {
      console.log(response.data);
    });
  }
}
