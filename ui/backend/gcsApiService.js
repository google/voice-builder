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
const utils = require('./utils');
const yaml = require('js-yaml');
// Constants for files and bucket in GCS.
const {
  PROJECT_ID,
  GCP_SERVICE_ACCOUNT_EMAIL,
  GCS,
  ZONE,
} = require('./config');
const {
  JOB_COUNTER_FILE,
  MODEL_SERVER_SPEC_FILENAME,
  PIPELINE_CREATE_REQUEST_FILENAME,
  PIPELINE_RUN_REQUEST_FILENAME,
  VOICE_SPEC_FILENAME,
  PIPELINE_INFO_FILENAME,
} = require('./constants').GCS;

const jobBucket = storage.bucket(GCS.JOB_BUCKET);
const getCurrentJobId = () => {
  const file = jobBucket.file(JOB_COUNTER_FILE);
  return file.download().then((data) => parseInt(data[0].toString('utf8'), 10));
};

const saveNewJobId = (newJobId) => {
  const file = jobBucket.file(JOB_COUNTER_FILE);
  return file.save(newJobId.toString());
};

const listJobFolders = () =>
  // A delimiter param helps us get only root files (1 layer below the bucket).
  jobBucket.getFiles({ delimiter: '/' })
    .then((results) => {
      const files = results[0];
      const jobList = files.map((file) => {
        const onlyJobId = file.name.replace('_$folder$', '');
        const { metadata, timeCreated } = file.metadata;
        return {
          id: onlyJobId,
          metadata,
          timeCreated,
        };
      });
      return jobList;
    });

/**
 * Gets the voice spec data and the job metadata for that job
 * An example response data:
 *
 * {
 *   ... (voice spec data)
 *   "createdBy": "noname@somemail.com",
 *   "status": "RUNNING_VOICE_EXPORT_WORKFLOW",
 *   "voiceExportStartTime": "2017-10-27T08:56:41.354Z"
 * }
 *
 * @param {string} jobId
 */
const getJobDetails = (jobId) => {
  const file = jobBucket.file(pathLib.join(jobId, VOICE_SPEC_FILENAME));
  const metaFile = jobBucket.file(`${jobId}_$folder$`);
  return Promise.all([file.download(), metaFile.getMetadata()])
    .then(([data, metadataRes]) => {
      const { metadata, timeCreated } = metadataRes[0];
      return Object.assign({}, JSON.parse(data[0].toString('utf8')),
        metadata,
        { voiceExportStartTime: timeCreated });
    });
};

const getJobLogFiles = (jobId, type) => {
  const pipelineInfoFile = jobBucket.file(pathLib.join(jobId, PIPELINE_INFO_FILENAME));
  return pipelineInfoFile.download()
    .then((data) => JSON.parse(data[0].toString('utf8')))
    .then((pipeline) => {
      const operationId = pipeline.operationName.substring('operations/'.length);
      const fileName = type ? `${operationId}-${type}` : `${operationId}`;
      const logFile = jobBucket.file(pathLib.join(jobId, `${fileName}.log`));
      return logFile.download().then((log) => (log.toString('utf8')));
    });
};

const getModelServerSpecFile = (jobId) => {
  const modelServerSpecFile = jobBucket.file(pathLib.join(jobId, MODEL_SERVER_SPEC_FILENAME));
  return modelServerSpecFile.download()
    .then((data) => JSON.parse(data[0].toString('utf8')));
};

const createTriggerFile = (voiceSpec) => {
  const jobIdStr = voiceSpec.id.toString();
  const triggerFile =
      jobBucket.file(pathLib.join(jobIdStr, '_resource_export_successful'));
  return triggerFile.save('');
};

const createVoiceCreationFailedFile = (voiceSpec) => {
  const jobIdStr = voiceSpec.id.toString();
  const file =
      jobBucket.file(pathLib.join(jobIdStr, '_voice_creation_failed'));
  return file.save('');
};

const copyOriginalResources = (voiceSpec) => {
  const jobIdStr = voiceSpec.id.toString();

  const dstLexiconFile =
      jobBucket.file(pathLib.join(jobIdStr, 'lexicon.scm'));
  const dstPhonologyFile =
      jobBucket.file(pathLib.join(jobIdStr, 'phonology.json'));
  const dstTextlineFile =
      jobBucket.file(pathLib.join(jobIdStr, 'txt.done.data'));
  const dstWavTarFile =
      jobBucket.file(pathLib.join(jobIdStr, 'wav.tar'));

  // TODO(twattanavekin): Handle an error from access permission to sources.
  // TODO(twattanavekin): Check files are in the correct formats.
  const srcLexiconPath = voiceSpec.lexicon_path.path;
  const srcPhonologyPath = voiceSpec.phonology_path.path;
  const srcWavTarPath = voiceSpec.wavs_path.path;
  const srcWavInfoPath = voiceSpec.wavs_info_path.path;
  return Promise.all([
    utils.copyGcsFile(srcLexiconPath, dstLexiconFile),
    utils.copyGcsFile(srcPhonologyPath, dstPhonologyFile),
    utils.copyGcsFile(srcWavInfoPath, dstTextlineFile),
    utils.copyGcsFile(srcWavTarPath, dstWavTarFile),
  ]);
};

// TODO: Simplify by creating util function for each file content population.
const initializeJobFolder = (voiceSpec) => {
  const jobIdStr = voiceSpec.id.toString();
  const ttsEngineFolder = voiceSpec.tts_engine;

  const modelServerSpecFile =
      jobBucket.file(pathLib.join(jobIdStr, MODEL_SERVER_SPEC_FILENAME));
  const pipelineCreateRequestFile =
      jobBucket.file(pathLib.join(jobIdStr, PIPELINE_CREATE_REQUEST_FILENAME));
  const pipelineRunRequestFile =
      jobBucket.file(pathLib.join(jobIdStr, PIPELINE_RUN_REQUEST_FILENAME));
  const voiceSpecFile =
      jobBucket.file(pathLib.join(jobIdStr, VOICE_SPEC_FILENAME));

  // Consolidate inputs into template.
  // TODO(twattanavekin): Better names for template files.
  // Templates to run Pipeline API
  const pipelineCreateRequestTmpl =
    require.main.require(`./templates/engines/${ttsEngineFolder}/pipelineCreateRequestTmpl.json`);
  const pipelineRunRequestTmpl =
    require.main.require(`./templates/engines/${ttsEngineFolder}/pipelineRunRequestTmpl.json`);
  // Templates to spawn up a synthesis server.
  const containerManifestTmpl =
    require.main.require(`./templates/engines/${ttsEngineFolder}/containerManifestTmpl.json`);
  const modelServerInstanceTmpl =
    require.main.require(`./templates/engines/${ttsEngineFolder}/modelServerInstanceTmpl.json`);

  const clonePipelineCreateRequest =
      Object.assign({}, pipelineCreateRequestTmpl, { projectId: PROJECT_ID });
  const clonePipelineRunRequest =
      Object.assign(
        {}, pipelineRunRequestTmpl,
        {
          pipelineArgs: {
            ...pipelineRunRequestTmpl.pipelineArgs,
            projectId: PROJECT_ID,
            inputs: {
              INPUT_WAV: `${voiceSpec.job_folder}/wav.tar`,
              PHONOLOGY_JSON: `${voiceSpec.job_folder}/phonology.json`,
              LEXICON_SCM: `${voiceSpec.job_folder}/lexicon.scm`,
              TEXT_LINE: `${voiceSpec.job_folder}/txt.done.data`,
              VOICE_SPEC: `${voiceSpec.job_folder}/${VOICE_SPEC_FILENAME}`,
            },
            outputs: {
              OUTPUT_VOICE: `${voiceSpec.job_folder}/built-voice.tar.gz`,
            },
            logging: {
              gcsPath: voiceSpec.job_folder,
            },
          },
        },
      );

  // Deep clone
  const instanceConfig = JSON.parse(JSON.stringify(modelServerInstanceTmpl));
  Object.assign(instanceConfig, {
    project: PROJECT_ID,
    zone: ZONE,
  });
  // Deep clone
  const containerManifest = JSON.parse(JSON.stringify(containerManifestTmpl));
  // TODO: Validate the config has container info and MODEL_GCS_PATH value.
  containerManifest.spec.containers[0].env[0].value =
      `${GCS.JOB_BUCKET}/${jobIdStr}/built-voice.tar.gz`;
  const containerManifestYaml = yaml.safeDump(containerManifest);
  console.log(`Container spec:\n${containerManifestYaml}`);
  const instanceName = utils.createSynthesisServerName(jobIdStr);
  // TODO(twattanavekin): acquire default service account instead of using
  // static one in the template.
  Object.assign(instanceConfig.resource, {
    name: instanceName,
    machineType: `zones/${ZONE}/machineTypes/n1-standard-1`,
    metadata: {
      items: [{
        key: 'gce-container-declaration',
        value: containerManifestYaml,
      }],
    },
    serviceAccounts: [{
      email: GCP_SERVICE_ACCOUNT_EMAIL,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    }],
  });

  // Fake folder is necessary in GCS as there is no folder concept in GCS.
  // Refer: https://cloud.google.com/storage/docs/gsutil/addlhelp/HowSubdirectoriesWork
  const jobFolderFakeFile = jobBucket.file(`${jobIdStr}_$folder$`);
  // Also sets createdBy so that we can show this data in the job list UI page.
  const metadata = {
    metadata: {
      createdBy: voiceSpec.created_by,
      status: 'Exporting Resources',
      voiceName: voiceSpec.voice_name,
    },
  };
  return Promise.all([
    jobFolderFakeFile.save('', { metadata }),
    modelServerSpecFile.save(JSON.stringify(instanceConfig)),
    pipelineCreateRequestFile.save(JSON.stringify(clonePipelineCreateRequest)),
    pipelineRunRequestFile.save(JSON.stringify(clonePipelineRunRequest)),
    voiceSpecFile.save(JSON.stringify(voiceSpec)),
  ]);
};

module.exports = {
  copyOriginalResources,
  createTriggerFile,
  createVoiceCreationFailedFile,
  getCurrentJobId,
  getJobDetails,
  getJobLogFiles,
  getModelServerSpecFile,
  initializeJobFolder,
  listJobFolders,
  saveNewJobId,
};
