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

const express = require('express');
const { exec } = require('child_process');

const utils = require('./utils');

const { SYNTH_SCRIPT } = require('./constants');

const router = express.Router();

/** GET for healthcheck */
router.get('/healthz', (_req, res) => res.json('OK'));

/**
* GET alignment information of the synthesized text.
* TODO: Implement alignment.
*/
router.get('/alignment', (req, res) => res.status(200).send([]));

/** GET synthesize voice based on a voice model */
router.get('/tts', (req, res) => {
  const { text, type } = req.query;
  const sanitizedText = utils.replaceCharactersWithSpaces(text);

  console.log(`Synthesizing ${sanitizedText}`);

  const options = {
    maxBuffer: 1024 * 1000, // 1 mb buffer
    cwd: '/tmp/',
    timeout: 60000, // 1 minute timeout
    encoding: 'buffer',
  };

  const child = exec(SYNTH_SCRIPT, options, (err, stdout, stderr) => {
    const errMsg = utils.getExecErrorMessage(err, stderr);
    if (errMsg) {
      return res.status(500).send(errMsg);
    }
    res.status(200);
    res.set('Content-Type', 'audio/wav');
    const data = type === 'base64' ? stdout.toString('base64') : stdout;
    return res.send(data);
  });
  child.stdin.write(sanitizedText);
  child.stdin.end();
});

module.exports = router;
