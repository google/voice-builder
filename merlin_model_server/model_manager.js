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

const fs = require('fs');
const gunzip = require('gunzip-maybe');
const gcs = require('@google-cloud/storage')();
const tar = require('tar-fs');

/**
 * Downloads a voice model and deploy it to targetFolder
 * A model needs to contain all necessary resources (including wavs) to
 * synthesize a voice.
 * @param {String} gcsPath a path to a job folder in GCS
 * @param {String} targetFolder a local folder to extract a model in
 */
const deployModel = (gcsPath, targetFolder) => {
  const [bucketName, modelPath] = gcsPath.split(/\/(.+)/);
  const bucket = gcs.bucket(bucketName);
  const modelFile = bucket.file(modelPath);
  const localFolder = targetFolder;
  if (!fs.existsSync(localFolder)) {
    console.log(`${localFolder} does not exist. Start creating one...`);
    fs.mkdirSync(localFolder);
  }
  console.log(`Deploying model from ${gcsPath} to ${localFolder}.`);
  return new Promise((resolve, reject) => {
    modelFile.createReadStream()
      .on('error', (err) => {
        console.log(err);
        reject(new Error('Failed to deploy a voice model.'));
      })
      .pipe(gunzip())
      .pipe(tar.extract(localFolder))
      .on('finish', () => {
        const successMsg = 'Successfully deployed a voice model.';
        resolve(successMsg);
      });
  });
};

module.exports = {
  deployModel,
};
