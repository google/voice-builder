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
 * Controller to show a list of all voice building jobs.
 */
export default class ListJobsCtrl {
  /**
   * @param {!angular.$http} $http
   * @ngInject
   */
  constructor($http) {
    /** @const @private {!angular.$http} */
    this.http_ = $http;

    /** @export {!Array<!Object>} */
    this.jobs = [];

    this.getJobList_();
  }

  /**
   * Get a list of jobs
   * @private
   */
  getJobList_() {
    this.http_.get('/api/jobs').then((response) => {
      // TODO(pasindu): Handle errors.
      this.jobs = response.data.map((item) =>
        Object.assign({}, item, { timeCreatedLocal: new Date(item.timeCreated).toLocaleString() }),
      );
    });
  }

  // A comparable function to sort job list.
  sortJobComparable(job) {
    return -parseInt(job.id);
  }

}
