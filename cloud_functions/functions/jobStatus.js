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

const gcs = require('@google-cloud/storage')();
const google = require('googleapis');

const { JOB_BUCKET } = require('./config').GCS;

const GCP_API_SCOPE = ['https://www.googleapis.com/auth/cloud-platform'];

const compute = google.compute('beta');

// Instantiate global variable;
const global = {};
google.auth.getApplicationDefault((err, authClient, _projectId) => {
  if (err) {
    throw err;
  }
  if (authClient.createScopedRequired && authClient.createScopedRequired()) {
    // eslint-disable-next-line no-param-reassign
    authClient = authClient.createScoped(GCP_API_SCOPE);
  }
  global.genomics = google.genomics({
    version: 'v1alpha2',
    auth: authClient,
  });

  global.authClient = authClient;
});

/**
 * Creates a promise for genomics.pipelines.create method.
 */
const createPipeline = (createRequest) => new Promise((resolve, reject) => {
  global.genomics.pipelines.create({ resource: createRequest }, (createErr, createRes) => {
    if (createErr) {
      return reject(createErr);
    }
    return resolve(createRes);
  });
});

/**
 * Creates a promise for genomics.pipelines.run method.
 */
const runPipeline = (runRequest) => new Promise((resolve, reject) => {
  global.genomics.pipelines.run({ resource: runRequest }, (runErr, runRes) => {
    if (runErr) {
      return reject(runErr);
    }
    return resolve(runRes);
  });
});

/**
 * Starts the pipeline job with given jobId.
 * @param {String} jobId
 */
const startPipelineJob = (jobId) => {
  const bucket = gcs.bucket(JOB_BUCKET);
  const createPipelineRequestFile = bucket.file(`${jobId}/pipelineCreateRequest.json`);
  const runPipelineRequestFile = bucket.file(`${jobId}/pipelineRunRequest.json`);
  const pipelineIdFile = bucket.file(`${jobId}/pipelineInfo.json`);
  let createRequest;
  let runRequest;
  return createPipelineRequestFile.download()
    .then((data) => {
      createRequest = JSON.parse(data[0].toString('utf8'));
      return runPipelineRequestFile.download();
    })
    .then((data) => {
      runRequest = JSON.parse(data[0].toString('utf8'));
      return createPipeline(createRequest);
    })
    .then((createRes) => {
      const { pipelineId } = createRes;
      // eslint-disable-next-line no-param-reassign
      console.log(`Successfully created a pipeline: ${pipelineId}`);
      runRequest.pipelineId = pipelineId;
      return runPipeline(runRequest);
    })
    .then((runRes) => {
      const { pipelineId } = runRes.metadata.request;
      const operationName = runRes.name;
      console.log(`Start running a pipeline: ${pipelineId}`);
      // Write pipeline id to the job folder
      return pipelineIdFile.save(JSON.stringify({
        pipelineId,
        operationName,
      }));
    })
    .then(() => {
      console.log('Successfully created pipeline info file');
    })
    .catch((err) => {
      const failedVoiceTrainingStart = bucket.file(`${jobId}/_training_pipeline_start_failed`);
      failedVoiceTrainingStart.save('')
      console.error(err);
    });
};

/**
 * Creates a promise for google compute's instance creation api.
 */
const createInstance = (instanceConfig) => new Promise((resolve, reject) => {
  compute.instances.insert(instanceConfig, (insertErr, vms) => {
    if (insertErr) {
      return reject(insertErr);
    }
    return resolve(vms);
  });
});

/**
 * Creates a model server for a specified job id.
 * @param {String} jobId
 */
const createModelServer = (jobId) => {
  const bucket = gcs.bucket(JOB_BUCKET);
  const modelServerSpecFile = bucket.file(`${jobId}/modelServerSpec.json`);
  const modelDeployedSuccessFile =
      bucket.file(`${jobId}/_voice_model_deployment_successful`);
  const modelDeployedFailureFile =
      bucket.file(`${jobId}/_voice_model_deployment_failed`);
  return modelServerSpecFile.download()
    .then((data) => {
      const instanceConfig = JSON.parse(data[0].toString('utf8'));
      instanceConfig.auth = global.authClient;
      return createInstance(instanceConfig);
    })
    .then((vms) => {
      console.log('Successfully created a model server');
      console.log(vms);
      return modelDeployedSuccessFile.save('');
    })
    .then(() => {
      console.log('Successfully created a voice model success file.');
    })
    .catch((err) => {
      console.error(err);
      return modelDeployedFailureFile.save('');
    })
    .then(() => {
      console.log('Successfully created a voice model failure file.');
    });
};

module.exports = {
  _resource_export_failed: {
    text: 'Failed To Export Files',
  },
  _voice_creation_failed: {
    text: 'Failed to create the voice',
  },
  _resource_export_successful: {
    text: 'Started Training Voice Model',
    callback: startPipelineJob,
  },
  _training_pipeline_start_failed: {
    text: 'Failed to start voice training',
  },
  'built-voice.tar.gz': {
    text: 'Completed Voice Model Training',
    callback: createModelServer,
  },
  _voice_model_deployment_successful: {
    text: 'Completed Voice Model Deployment',
  },
  _voice_model_deployment_failed: {
    text: 'Failed To Deploy Model',
  },
};
