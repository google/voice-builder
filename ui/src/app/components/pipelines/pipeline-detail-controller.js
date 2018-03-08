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
 * Controller which presents all details of the given pipeline.
 */
export default class PipelineDetailsCtrl {
  /**
   * @param {!angular.$http} $http
   * @param {!angular.$routeParams} $routeParams
   * @ngInject
   */
  constructor($http, $routeParams) {
    /** @const @private {!angular.$http} */
    this.http_ = $http;

    /** @export {!Array<!Object>} */
    this.pipeline = {};

    this.getPipelineInfo_($routeParams.pipelineName);
  }

  /**
   * Get voice building pipeline information.
   * @param {!string} pipelineName Voice building pipeline name.
   * @private
   */
  getPipelineInfo_(pipelineName) {
    this.http_.get(`/api/pipeline/${pipelineName}`).then((response) => {
      this.pipeline = response.data;
      // TODO(twattanavekin): Remove later as this is just to show all details
      // in text panel temporarily.
      this.pipelineStr = JSON.stringify(this.pipeline, null, '\t');
      const computeEngine = this.pipeline.metadata.runtimeMetadata.computeEngine;
      this.containerLink = 'https://console.cloud.google.com/compute/instancesDetail' +
      `/zones/${computeEngine.zone}` +
      `/instances/${computeEngine.instanceName}?` +
      `project=${this.pipeline.metadata.request.pipelineArgs.projectId}&` +
      'graph=GCE_CPU&duration=PT12H';
    });
  }
}
