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
 * Directive for the form select to create a new wav set.
 * @param {!angular.$http} $http
 * @param {!angular.$httpParamSerializer} $httpParamSerializer
 * @return {!angular.Directive}
 * @ngInject
 */
export default function addWavDialog($http, $httpParamSerializer, toast) {
  return {
    templateUrl: '/components/resource-library/add-wav-dialog-template.ng',
    restrict: 'E',
    scope: {},
    link(scope, element) {
      scope.langIdList = ['en-SG', 'si-LK', 'th-TH'];
      scope.resetInputFormValues = () => {
        scope.wavSetName = 'Singaporean English Small Example Wav Set';
        scope.wavSetPath = `${utils.CONSTANTS.DEFAULT_DATA_BASE_PATH}/wavs.tar.gz`;
        scope.wavSetNotes = '';
        scope.wavSetLangId = 'en-SG';
      };
      scope.resetInputFormValues();

      scope.uploadWavButtonClickHandler = () => {
        const dialog = angular.element('#addWavModal');

        // Disable all inputs.
        const inputElements = angular.element('#addWavModal :input');
        inputElements.attr('disabled', true);

        // Show loading spinner.
        const uploadButton = angular.element('#uploadWavButton');
        uploadButton.button('loading');

        // Send a request to backend to start Borg job.
        $http({
          url: '/api/create_wav_resource',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            name: scope.wavSetName,
            lang_id: scope.wavSetLangId,
            notes: scope.wavSetNotes,
            path: scope.wavSetPath,
          }),
        })
          .then((response) => {
            if (!element || element.length === 0 ||
                  !element[0].querySelector('#addWavModal')) {
              throw new Error('cannot find #addWavModal element');
            }
            toast(
              `Successfully created a wav resource - ${scope.wavSetName}`);
          })
          .catch((err) => {
            // TODO(twattanavekin): Change to toast notification.
            toast(
              `Error creating a wav resource for ${scope.wavSetName}:\n${
                err.data.message}`);
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
