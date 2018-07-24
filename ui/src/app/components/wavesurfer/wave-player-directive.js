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

import WaveSurfer from 'wavesurfer.js';
import RegionPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline';
import SpectrogramPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.spectrogram';
import { CONSTANTS } from '../../shared/utils';

/**
 * Directive for the form input to create a new voice.
 * @return {!angular.Directive}
 */
export default function wavePlayer($document, $http) {
  return {
    restrict: 'E',
    scope: {
      src: '@',
      text: '@',
      spectrogram: '@',
    },
    templateUrl: '/components/wavesurfer/wave-player-template.ng',
    link(scope, $element, $attrs) {
      $element.css('display', 'block');
      scope.paused = true;
      const jobId = $attrs.jobid;
      const text = scope.text.replace(/\n/g, ' ');
      if (text) {
        $http({
          url: `api/job/${jobId}/model_server/alignment?text=${text}`,
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }).then((response) => {
          scope.alignment = response.data;
          this.init(scope, $element);
          scope.disablePlay = false;
        }).catch((response) => {
          const element = $element[0].querySelector('#wavesurfer');
          element.innerHTML = response.data;
          scope.disablePlay = true;
        });
      } else {
        this.init(scope, $element);
      }
    },
    init(scope, $element) {
      const element = $element[0].querySelector('#wavesurfer');
      const timelineElement = $element[0].querySelector('#timeline');
      const spectrogramElement = $element[0].querySelector('#wave-spectrogram');
      element.innerHTML = '';
      timelineElement.innerHTML = '';
      const plugins = [
        RegionPlugin.create(),
        TimelinePlugin.create({
          container: timelineElement,
          timeInterval: 0.1,
        }),
      ];
      if (scope.spectrogram === 'true') {
        const spectrogramPlugin = SpectrogramPlugin.create({
          container: spectrogramElement,
        });
        plugins.push(spectrogramPlugin);
      }
      const wavesurfer = WaveSurfer.create({
        container: element,
        plugins,
      });
      wavesurfer.load(scope.src || null);
      scope.voice = true;
      scope.wavesurfer = wavesurfer;
      wavesurfer.on('play', () => {
        scope.paused = false;
      });
      wavesurfer.on('pause', () => {
        scope.paused = true;
      });
      wavesurfer.on('finish', () => {
        scope.paused = true;
        scope.wavesurfer.seekTo(0);
        scope.$apply();
      });
      wavesurfer.on('ready', () => {
        const alignment = scope.alignment;
        const oddBackground = 'hsla(100, 100%, 30%, 0.1)';
        const evenBackground = 'hsla(200, 100%, 30%, 0.1)';
        let starttime = 0;
        for (let i = 0; i < alignment.length; i++) {
          const item = alignment[i];
          const region = scope.wavesurfer.addRegion({
            id: `so${i}`,
            start: starttime,
            end: item.endtime,
            drag: false,
            resize: false,
            color: i % 2 === 0 ? oddBackground : evenBackground,
          });
          region.element.setAttribute('title', item.phoneme);
          region.element.appendChild($document[0].createTextNode(item.phoneme));
          starttime = item.endtime;
        }
      });
      scope.play = (url) => {
        if (!scope.wavesurfer) {
          return;
        }
        this.activeUrl = url;
        scope.wavesurfer.once('ready', () => {
          scope.wavesurfer.play();
          scope.$apply();
        });
        scope.wavesurfer.load(this.activeUrl);
      };
      scope.isPlaying = (url) => url === this.activeUrl;
    },
  };
}
