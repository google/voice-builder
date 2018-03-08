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

/**
 * Directive for the uploading dialog for a new resource (f0, MCEP, etc.) which
 * will be binded to its parent wav set.
 * @param {!angular.$http} $http
 * @param {!angular.$httpParamSerializer} $httpParamSerializer
 * @return {!angular.Directive}
 * @ngInject
 */
export default function addResourceDialog($http, $httpParamSerializer, toast) {
  return {
    templateUrl: '/components/resource-library/add-resource-dialog-template.ng',
    restrict: 'E',
    scope: {
      entityId: '@',
    },
    link(scope, element) {
      scope.typeList = ['F0', 'LF0', 'MCEP', 'MGC', 'BAP', 'WAVS_INFO'];
      scope.outputFormatList = ['HTK', 'BINARY', 'ASCII'];

      // Sets default values to show in dialog
      scope.resetInputFormValues = () => {
        scope.type = 'WAVS_INFO';
        scope.outputFormat = 'ASCII';
        scope.path = `${utils.CONSTANTS.DEFAULT_DATA_BASE_PATH}/line_index.tsv`;
        scope.notes = '';
      };
      scope.resetInputFormValues();

      scope.upload = () => {
        // entityId is in the format of AudioResource-<id>
        if (!scope.entityId) {
          console.log('Something went wrong! EntityId is empty.');
          return;
        }
        const modalId = `#addResourceModal-${scope.entityId}`;
        const dialog = angular.element(element[0].querySelector(modalId));

        // Disable all inputs.
        const inputElements = angular.element(`${modalId} :input`);
        inputElements.attr('disabled', true);

        // Disable button and show loading spinner.
        const uploadButton =
            angular.element(element[0].querySelector('#uploadButton'));
        uploadButton.button('loading');

        const parentId = scope.entityId;
        $http({
          url: '/api/create_nested_resource',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            parent_id: parentId,
            type: scope.type,
            output_format: scope.outputFormat,
            path: scope.path,
            notes: scope.notes,
          }),
        })
          .then((response) => {
            toast(`Successfully created a nested resource for ${scope.type}`);
          })
          .catch((err) => {
            toast(
              `Error creating a nested resource for ${scope.type}:\n${
                err.data.message}`, true);
          })
          .finally(() => {
            dialog.modal('hide');

            // Set input form to initial values and enable all inputs.
            scope.resetInputFormValues();
            uploadButton.button('reset');
            inputElements.removeAttr('disabled');
          });
      };
    },
  };
}
