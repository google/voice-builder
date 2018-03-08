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

import formatEntityResultsForDataTable from '../../shared/datatable-utils';

/**
 * Directive for the nested table that show nest resources that are binded to
 * their parent wav set.
 * @param {!angular.$http} $http
 * @param {!angular.$httpParamSerializer} $httpParamSerializer
 * @return {!angular.Directive}
 * @ngInject
 */
export default function nestedTable($http, $httpParamSerializer, toast) {
  return {
    templateUrl: '/components/resource-library/nested-table-template.ng',
    restrict: 'E',
    scope: {
      entityId: '@',
    },
    link(scope, element) {
      // The entityId is in the format of "<data_kind>+<id>".
      // Here, we extract only id for query its nested resource later.
      const parentEntityId = scope.entityId;
      // Extract resources whose has parent id as "entityId".
      // Note that this also returns the parent entity itself.
      // TODO(twattanavekin): Have centralized constant file and put
      // content-type there.
      $http({
        url: `/api/get_nested_resources/${parentEntityId}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
        .then((response) => {
          const allResources = response.data;
          const nestedResource = allResources[0].slice(0);
          scope.parentResource = scope.$parent.data;
          const table = angular.element(`#row_${scope.entityId}`).dataTable({
            searching: false,
            info: false,
            paging: false,
            ordering: false,
            data: nestedResource,
            columns: [
              { data: 'Type' }, { data: 'Path' }, { data: 'Format' },
              { data: 'UploadedTime' }, { data: 'CreatedBy' }, { data: 'Notes' }, {
                className: 'deleteButton',
                orderable: false,
                data: null,
                defaultContent: '<button>Delete</button>',
              },
            ],
          });
          angular.element(`#row_${scope.entityId} tbody`)
            .on('click', 'td.deleteButton', (e) => {
              const tr = $(e.target).closest('tr');
              const row = table.api().row(tr);
              // Entity id is in the form of
              // AudioResource-<parent_id>_NestedResource-<nested_id>
              const entityId = row.data().EntityId;
              const parentId = entityId.split('_')[0].split('-')[1];
              const id = entityId.split('_')[1].split('-')[1];
              $http({
                url: '/api/delete_nested_resource',
                method: 'POST',
                headers:
                      { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: $httpParamSerializer({
                  parent_id: parentId,
                  id,
                }),
              })
                .then((response) => {
                  toast('Successfully deleted a nested resource.');
                })
                .catch((err) => {
                  toast(`Error deleting a nested resource:\n ${err.data.message}`, true);
                });
            });
        })
        .catch((err) => {
          toast(`Error retrieving a nested resource:\n ${err.data.message}`, true);
        });
      // Delete wav resource handler
      scope.deleteWavResource = () => {
        // The entityId is in the format of "<data_kind>+<id>".
        // Here, we extract only id for query its nested resource later.
        const id = scope.entityId.split('-')[1];
        $http({
          url: '/api/delete_wav_resource',
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          data: $httpParamSerializer({
            id,
          }),
        })
          .then((response) => {
            toast('Successfully deleted a wav resource.');
          })
          .catch((err) => {
            toast(`Error deleting a wav resource:\n ${err.data.message}`, true);
          });
      };
    },
  };
}
