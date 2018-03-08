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
import utils from '../../shared/utils';

/**
 * Shows a form to choose resources from Resource Library.
 * @param {!angular.$http} $http
 * @param {!angular.$httpParamSerializer} $httpParamSerializer
 * @return {!angular.Directive}
 * @ngInject
 */
export default function resourceLibraryListing($http, $httpParamSerializer) {
  return {
    templateUrl:
        '/components/create-voice/resource-library-listing-template.ng',
    scope: {
      model: '=',
    },
    link(scope, element) {
      scope.CONSTANTS = utils.CONSTANTS;
      scope.nestedResourceList = [];
      // TODO(twattanavekin): Put a lang id list into a new centralized constant
      // file.
      scope.langIdList = ['en-SG', 'si-LK', 'th-TH'];
      scope.resourceLibraryOptions = {
        VOICE_FEATURES: 'Voice Features',
        F0: 'F0/LF0',
        BAP: 'BAP',
        MCEP: 'MCEP/MGC',
        ALIGNMENT: 'Alignment',
        UTTERANCE: 'Utterance',
      };
      scope.langIdChangeHandler = () => {
        scope.wavSetList = [];
        $http({
          method: 'POST',
          url: '/api/run_gql',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          data: $httpParamSerializer({
            gql_query: `SELECT * FROM AudioResource WHERE LangId="${
              scope.langId}"`,
          }),
        }).then((response) => {
          // Do nothing else if no result from the query.
          if (!response.data || !response.data.entityResults) {
            return;
          }
          scope.wavSetList =
              formatEntityResultsForDataTable(response.data.entityResults);
        });
      };

      let selectedParentEntityId;

      scope.wavSetChangeHandler = () => {
        if (!scope.wavSet || !scope.wavSet.EntityId) {
          return;
        }
        scope.model.wavs = scope.wavSet.Path;
        scope.model.wavsLocation = 'RESOURCE_LIBRARY';
        // The entityId is in the format of "<data_kind>+<id>".
        // Here, we extract only id for query its nested resource later.
        const selectedParentEntityId = scope.wavSet.EntityId;
        $http({
          method: 'POST',
          url: '/api/run_gql',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          data: $httpParamSerializer({
            gql_query: 'SELECT * FROM NestedResource ' +
                       'WHERE __key__ HAS ANCESTOR ' +
                       `KEY(AudioResource,${selectedParentEntityId})`,
          }),
        }).then((response) => {
          scope.nestedResourceList = [];
          // Do nothing else if no result from the query.
          if (!response.data || !response.data.entityResults) {
            return;
          }
          scope.nestedResourceList =
              formatEntityResultsForDataTable(response.data.entityResults);
        });
      };

      scope.wavsInfoChangeHandler = () => {
        scope.model.wavsInfo = scope.wavsInfo.Path;
      };

      scope.cacheSelectChangeHandler = () => {
        scope.model.selectedWavsSetId = 0;
        if (scope.cache == utils.CONSTANTS.ENABLE_SAVE_FEATURES_KEY) {
          const filename = `${new Date().getTime()}_voice_features.tar.gz`;
          scope.model.pathToSaveCache =
              `${scope.wavSet.ResourceFolder}/${filename}`;
          scope.model.pathToLoadCache = '';
          scope.model.selectedWavsSetId = selectedParentEntityId;
        } else if (
          scope.cache == utils.CONSTANTS.ENABLE_LOAD_CACHED_FEATURES_KEY &&
            scope.voiceFeatures) {
          scope.model.pathToSaveCache = '';
          scope.model.pathToLoadCache = scope.voiceFeatures.Path;
        } else {
          scope.model.pathToLoadCache = '';
          scope.model.pathToSaveCache = '';
        }
      };
    },
  };
}
