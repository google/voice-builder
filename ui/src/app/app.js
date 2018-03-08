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

import 'angular-material/angular-material.min.css';

import angular from 'angular';
import 'angular-aria';
import ngAnimate from 'angular-animate';
import ngMaterial from 'angular-material';
import ngRoute from 'angular-route';

import '../css/style.css';
import CreateVoiceCtrl from './components/create-voice/create-voice-controller';
import resourceLibraryListingDirective from './components/create-voice/resource-library-listing-directive';
import voiceCombinedInputDirective from './components/create-voice/voice-combined-input-directive';
import voiceInputDirective from './components/create-voice/voice-input-directive';
import voiceSelectDirective from './components/create-voice/voice-select-directive';
import JobDetailsCtrl from './components/jobs/job-detail-controller';
import ListJobsCtrl from './components/jobs/list-jobs-controller';
import ListPipelinesCtrl from './components/pipelines/list-pipelines-controller';
import PipelineDetailsCtrl from './components/pipelines/pipeline-detail-controller';
import addResourceDialogDirective from './components/resource-library/add-resource-dialog-directive';
import addWavDialogDirective from './components/resource-library/add-wav-dialog-directive';
import nestedTableDirective from './components/resource-library/nested-table-directive';
import wavePlayerDirective from './components/wavesurfer/wave-player-directive';
import ResourceLibraryCtrl from './components/resource-library/resource-library-controller';

/** Initialize the angular app. */
const app = angular.module('app', [ngRoute, ngAnimate, ngMaterial]);

/**
 * Declare directives
 * TODO(twattanavekin): Add prefix 'vm' in front of all directive tags to have
 * clearer info. their sources/references when using them in html files.
 * For example, nestedTable renames to vmNestedTable to
 * get a result tag as <vm-nested-table></vm-nested-table>.
 */
app.directive(
  'addResourceDialog',
  ['$http', '$httpParamSerializer', 'toast', addResourceDialogDirective]);
app.directive(
  'addWavDialog', ['$http', '$httpParamSerializer', 'toast', addWavDialogDirective]);
app.directive(
  'nestedTable', ['$http', '$httpParamSerializer', 'toast', nestedTableDirective]);
app.directive(
  'resourceLibraryListing',
  ['$http', '$httpParamSerializer', resourceLibraryListingDirective]);
app.directive('voiceCombinedInput', voiceCombinedInputDirective);
app.directive('voiceInput', voiceInputDirective);
app.directive('voiceSelect', voiceSelectDirective);
app.directive('wavePlayer',['$document', '$http', wavePlayerDirective]);

app.controller('ToastController', ['$scope', '$mdToast', function($scope, $mdToast) {
    $scope.closeToast = () => {
    $mdToast.hide();
  }}]);
app.factory('toast', ['$mdToast', function($mdToast) {
  return (message, error) => {
    const warnClass = error ? 'md-warn' : 'md-primary';
    $mdToast.show(
      $mdToast.simple()
        .position("top right")
        .textContent(message)
        .action('OK')
        .highlightAction(true)
        .highlightClass(warnClass)
        .hideDelay(3000),
      );
    };
}]);
/**
 * Routes the application based on the URL.
 *
 * @param {!angular.$routeProvider} $routeProvider
 * @ngInject
 */
const configureRoutes = ($routeProvider) => {
  $routeProvider
    .when('/', {
      templateUrl: '/components/jobs/list-jobs-view.ng',
      controller: ['$http', ListJobsCtrl],
      controllerAs: 'ctrl',
    })
    .when('/create_voice', {
      templateUrl: '/components/create-voice/create-voice-view.ng',
      controller:
            ['$http', '$httpParamSerializer', '$scope', 'toast', CreateVoiceCtrl],
      controllerAs: 'ctrl',
    })
    .when('/pipelines', {
      templateUrl: '/components/pipelines/list-pipelines-view.ng',
      controller: ['$http', '$location', ListPipelinesCtrl],
      controllerAs: 'ctrl',
    })
    .when('/pipeline/:pipelineName*', {
      templateUrl: '/components/pipelines/pipeline-detail-view.ng',
      controller: ['$http', '$routeParams', PipelineDetailsCtrl],
      controllerAs: 'ctrl',
    })
    .when('/resource_library', {
      templateUrl: '/components/resource-library/resource-library-view.ng',
      controller: ['$compile', '$scope', '$http', '$mdDialog', ResourceLibraryCtrl],
      controllerAs: 'ctrl',
    })
    .when('/:jobId', {
      templateUrl: '/components/jobs/job-detail-view.ng',
      controller: [
        '$http', '$routeParams', '$sce', JobDetailsCtrl,
      ],
      controllerAs: 'ctrl',
    });
};
app.config(['$routeProvider', '$locationProvider', configureRoutes]);
const themeConfig = ($mdThemingProvider) => {
  $mdThemingProvider.theme('default')
    .primaryPalette('blue', {
      default: '700', // override default 400 to 700
    })
    .accentPalette('blue');
};
app.config(['$mdThemingProvider', themeConfig]);

export default app;
