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

import { EntityType, formatEntityResultsForDataTable } from '../../shared/datatable-utils';

/**
 * Controller to manage a list of Resource Library.
 *
 * Voice building process requires a set of wavs as well as its dependent
 * resources such as lexicon file, phoneme inventory file, and etc.
 * Resource Library acts like a main reposity to cache these resources
 * for a reuse to build different voices with different settings.
 *
 * This controller is used to manage (show/add/delete) all resource information
 * utilizing DataTable (https://datatables.net). Each row in the table shows
 * a list of wav set and will show each wav set's nested resources
 * when a user clicks on its row.
 */
export default class ResourceLibraryCtrl {
  /**
   * @param {!angular.$compile} $compile
   * @param {!angular.$scope} $scope
   * @param {!angular.$http} $http
   * @ngInject
   */
  constructor($compile, $scope, $http, $mdDialog) {
    /** @const @private {!angular.$http} */
    this.http_ = $http;
    /** @const @private {!angular.$compile} */
    this.compile_ = $compile;
    /** @const @private {!angular.$scope} */
    this.scope_ = $scope;
    this.mdDialog_ = $mdDialog;
    /** @export {!Array<!EntityType>} */
    this.resources;

    // Disable a warning when a record doesn't have enough data fields to fill
    // all complete table columns.
    dt.ext.errMode = 'none';

    // Get all resources from Datastore.
    this.getResources_();

    this.scope_.showAddWavDialog = (event) => {
      this.mdDialog_.show({
        templateUrl: '/components/resource-library/add-wav-dialog-template.ng',
        parent: angular.element(document.body),
        targetEvent: event,
        clickOutsideToClose: true,
        fullscreen: true,
      });
    }
  }

  /**
   * Get resource information.
   * @private
   */
  getResources_() {
    // Get all audio resources
    this.http_({
      url: '/api/get_wav_resources',
      method: 'GET',
    })
      .then((response) => {
        this.resources = response.data;
        const oTable = angular.element('#resourceTable').dataTable({
          data: this.resources,
          columns: [
            { data: 'Name' },
            { data: 'OriginalPath' },
            { data: 'LangId' },
            { data: 'SampleRate' },
            { data: 'States' },
            { data: 'UploadedTime' },
          ],
        });
        angular.element('#resourceTable tbody tr').on('click', ({ currentTarget }) => {
          if (oTable.fnIsOpen(currentTarget)) {
            oTable.fnClose(currentTarget);
          } else {
            const data = oTable.api().row(currentTarget).data();
            const entityId = data.EntityId;
            this.scope_.data = data;
            const nestedTable =
                  `<nested-table entity-id="${entityId}"></nested-table>`;
              // TODO(twattanvekin): Pass the resource varaible instead of
              // scope.
            const compiledNestedTable =
                  this.compile_(nestedTable)(this.scope_);
            oTable.fnOpen(currentTarget, compiledNestedTable, '');
          }
        });
      });
  }
}
