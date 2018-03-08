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

/**
 * @fileoverview A cloud funtion to trigger a voice building when GCS's job
 * folder contains all necessary files (txt.done.data, lexicon.scm,
 * phonology.json, and wav.tar)
 */
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const jobStatus = require('./jobStatus');

const { JOB_BUCKET } = require('./config').GCS;

/**
 * Listener for the job bucket to watch file changes.
 * This listener updates a job status when the files with special names are added to job folders.
 * If there is a callback function associated with the job status,
 * it will be called after the status of metadata file is changed.
 */
exports.onJobBucketChange =
  functions.storage.bucket(JOB_BUCKET).object().onChange((event) => {
    const object = event.data;

    const filePath = object.name;
    const {
      // A name of resource state
      // whose value is 'exists' or 'not_exists' (for file/folder deletions).
      resourceState,
      // A number represents the generation of metadata file. Its value is 1 for a new objects.
      metageneration,
    } = object;

    const splitFilenames = filePath.split('/');
    const jobId = splitFilenames[0];
    const basename = splitFilenames[1];
    // Check if current operation is adding a new file to a job folder
    if (resourceState === 'exists' && Number(metageneration) === 1 && splitFilenames.length === 2) {
      const status = jobStatus[basename];
      if (status) {
        const bucket = gcs.bucket(JOB_BUCKET);
        const metaFile = bucket.file(`${jobId}_$folder$`);
        return metaFile.setMetadata({
          metadata: {
            status: status.text,
          },
        })
          .then(() => {
            console.log(`The status of job ${jobId} is updated to "${status.text}"`);
            return status.callback !== undefined ? status.callback(jobId) : Promise.resolve();
          });
      }
    }
    console.warn(`Path: ${filePath}, State: ${resourceState}, \
      Metageneration: ${metageneration} ${splitFilenames.length} \
      An unrelated file change. Exit...`);
    return Promise.resolve();
  });
