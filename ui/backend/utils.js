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

const pathLib = require('path');
const storage = require('@google-cloud/storage')();

/**
 * Handy function to copy file within GCS
 * @param {String} srcPath an original path in GCS
 * @param {GcsFile} destFile a destination GCS File object.
 */
const copyGcsFile = (srcPath, destFile) => {
  const matchesArray = srcPath.match(/gs:\/\/([^\/]*)\/(.*)/);
  if (!matchesArray) {
    throw new Error('path is not in the correct gcs format.');
  }
  const srcBucketName = matchesArray[1];
  const srcFileName = matchesArray[2];
  return storage.bucket(srcBucketName)
    .file(srcFileName)
    .copy(destFile);
};

const createTargetGcsBasePath = (langId, resourceName) => pathLib.join(
  'gs://path-to-resource-location/', // Change when resource library is enabled.
  langId,
  resourceName.replace(/[\s/]/g, '_'),
);

const createSynthesisServerName = (jobId) => `model-server-${jobId}`;

module.exports = {
  copyGcsFile,
  createSynthesisServerName,
  createTargetGcsBasePath,
};
