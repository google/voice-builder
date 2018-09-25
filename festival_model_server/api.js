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

const { FESTIVAL_BIN, TEXT_TO_WAV_BIN } = require('./constants');

const router = express.Router();

/** GET for healthcheck */
router.get('/healthz', (_req, res) => res.json('OK'));

/** GET alignment information of the synthesized text. */
router.get('/alignment', (req, res) => {
  const { text } = req.query;
  // TODO(twattanavekin): Test Unicode text.
  const sanitizedText = utils.replaceCharactersWithSpaces(text);

  const { festvoxFile, voiceName, localFolder } = utils.getVoiceSettings();

  // Example command:
  // read txt; TEXT=${txt};
  // ${FESTIVALDIR}/bin/festival
  // -b festvox/goog_vb_unison_cg.scm  -b "(voice_goog_vb_unison_cg)"
  // -b "(Parameter.set 'Audio_Method 'Audio_Command)"
  // -b "(Parameter.set 'Audio_Command \"\")"
  // -b "(utt.relation.print (SayText \" ${TEXT} \") 'Segment)";

  const cmd = `read txt; TEXT=\$\{txt\}; ${FESTIVAL_BIN} -b ${festvoxFile}  -b "(${voiceName})" \
  -b "(Parameter.set 'Audio_Method 'Audio_Command)" \
  -b "(Parameter.set 'Audio_Command \\"\\")" \
  -b "(utt.relation.print (SayText \\" \$\{TEXT\} \\") 'Segment)";`;

  const options = {
    cwd: localFolder,
    timeout: 10000,
    encoding: 'buffer',
  };

  console.log(`Running command - \n${cmd}`);

  const child = exec(cmd, options, (err, stdout, stderr) => {
    const errMsg = utils.getExecErrorMessage(err, stderr);
    if (errMsg) {
      return res.status(500).send(errMsg);
    }
    return res.status(200).send(utils.getAlignmentData(stdout.toString()));
  });
  child.stdin.write(sanitizedText);
  child.stdin.end();
});

/** GET synthesize voice based on a voice model */
router.get('/tts', (req, res) => {
  const { text, type } = req.query;
  // TODO(twattanavekin): Test Unicode text.
  const sanitizedText = utils.replaceCharactersWithSpaces(text);
  console.log(`Synthesizing ${sanitizedText}`);

  const { festvoxFile, voiceName, localFolder } = utils.getVoiceSettings();

  // Example command:
  // festival/bin/text2wave \
  //  -eval festvox/goog_vb_unison_cg.scm \
  //  -eval "(voice_vb_unison_cg)"
  const cmd = `${TEXT_TO_WAV_BIN} -eval ${festvoxFile} -eval "(${voiceName})"`;
  console.log(`Running command - \n${cmd}`);

  const options = {
    cwd: localFolder,
    timeout: 10000,
    encoding: 'buffer',
  };

  const child = exec(cmd, options, (err, stdout, stderr) => {
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
