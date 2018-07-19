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
const google = require('googleapis');
const pathLib = require('path');
const proxy = require('http-proxy-middleware');

const datastoreOps = require('./datastoreOps');
const gcsApiService = require('./gcsApiService');
const dataExporterApiService = require('./dataExporterApiService');
const utils = require('./utils');

const config = require('./config');
const constants = require('./constants');

const compute = google.compute('beta');

const router = express.Router();

/** GET a list of all jobs. */
router.get('/jobs', (req, res) => {
  gcsApiService.listJobFolders()
    .then((jobList) => {
      res.send(jobList);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Failed to list jobs');
    });
});

/** GET details of a job. */
router.get('/job/:id', (req, res) => {
  const jobId = req.params.id;
  gcsApiService.getJobDetails(jobId)
    .then((content) => res.send(content))
    .catch((err) => {
      console.error(err);
      res.status(500).send(`Failed to get job details (jobId: ${jobId}).`);
    });
});

/** GET all the logs of a job. */
router.get('/job/:id/logs', (req, res) => {
  const jobId = req.params.id;
  const type = req.query.type;
  gcsApiService.getJobLogFiles(jobId, type)
    .then((content) => {
      res.set('Content-Type', 'text/plain').send(content);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(`Failed to get job logs (jobId: ${jobId}).`);
    });
});

/** GET server model info for the given job. */
router.get('/job/:id/model_server_info', (req, res) => {
  const jobId = req.params.id;
  const request = {
    auth: global.authClient,
    project: config.PROJECT_ID,
    zone: config.ZONE,
    instance: utils.createSynthesisServerName(jobId),
  };
  compute.instances.get(request, (err, vm) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }
    return res.status(200).send(vm);
  });
});

/**
 * GET to proxy a audio synthesis request to the right model server
 * e.g. <UI_SERVER_URL>/api/job/3/model_server/tts?text=hello ->
 * <MODEL_SERVER_3>/api/tts?text=hello
 */
router.all('/job/:id/model_server/*', (req, res, next) => {
  const jobId = req.params.id;
  // Nice thing about GCP's VPC network is that you can also address them by
  // instance name. So, we can just proxy it by name instead of internal ip.
  // Ref: https://cloud.google.com/compute/docs/networks-and-firewalls
  const instanceName = utils.createSynthesisServerName(jobId);
  proxy({
    target: `http://${instanceName}`,
    pathRewrite: {
      '/job/[0-9]*/model_server': '',
    },
  })(req, res, next);
});

/** GET to create a server model for this job. */
router.get('/job/:id/deploy_model', (req, res) => {
  const jobId = req.params.id;
  console.log('Start creating a model server');
  return gcsApiService.getModelServerSpecFile(jobId).then((modelServerConfig) => {
    modelServerConfig.auth = global.authClient;
    compute.instances.insert(modelServerConfig, (err, vms) => {
      if (err) {
        console.error('Failed to create a model server');
        return res.status(500).send(err);
      }
      console.log('Successfully creating a model server');
      return res.status(200).send(vms);
    });
  });
});


/**
 * GET a list available TTS engines.
 * Return empty if TTS_ENGINES is not found in config.
 */
router.get('/tts_engines', (req, res) => {
  const engines = config.TTS_ENGINES ? config.TTS_ENGINES : [];
  return res.status(200).send(engines);
});


/** Callback function to handle error from Pipeline API. */
const pipelineApiErrorHandler = (apiRes, successMsg) => (pipelineErr, pipelineRes) => {
  if (pipelineErr) {
    console.error(pipelineErr);
    return apiRes.status(500).send(pipelineErr);
  }
  console.log(successMsg);
  return apiRes.send(pipelineRes);
};

/** GET a list of all pipelines. */
router.get('/pipelines', (req, res) => {
  console.log('Requesting pipelines list...');
  global.genomics.operations.list(
    {
      name: 'operations',
      filter: `projectId=${config.PROJECT_ID}`,
    },
    pipelineApiErrorHandler(res, 'Successfully get the pipelines list.'),
  );
});

/** GET a list of all pipelines. */
router.get('/pipeline/:pipelineName(*)', (req, res) => {
  console.log('Requesting pipeline details...');
  const { pipelineName } = req.params;
  console.log(req.params);
  console.log(pipelineName);
  global.genomics.operations.get(
    { name: pipelineName },
    pipelineApiErrorHandler(res, 'Successfully get the pipeline details.'),
  );
});

/** POST to create a new voice by requesting data exporter api. */
router.post('/create_voice', (req, res) => {
  console.log('Requesting to data exporter API to start createVoice process...');
  const voiceSpec = req.body;
  // TODO(pasindu): Remove the following deletion when the system can support
  // cache_voice_features field.
  delete voiceSpec.cache_voice_features;

  // Promise workflow:
  // 1. Get the latest job id from a jobCounter.txt in the bucket.
  // 2. Paralelly do:
  // - Send a voice specification request to Voice Manager API
  // - Create a job folder structure & necessary initial files in GCS
  // - Increase job id in jobCounter.txt
  // Note that I don't think this solution gonna work in concurrent requests.
  // This is the simplest solution and should migrate to transactional database
  // such as Datastore or Firebase.
  //
  // TODO(twattanavekin): Change to transactional database.
  let newJobId;
  // If DATA_EXPORTER_API is not set, do direct copying.
  const directCopy = !config.DATA_EXPORTER_API;
  gcsApiService.getCurrentJobId()
    .then((jobId) => {
      newJobId = jobId + 1;
      voiceSpec.id = newJobId;
      console.log('Increasing job id number by 1.');
      console.log('Add job folder location to Voice Specification.');
      voiceSpec.job_folder = `gs://${config.GCS.JOB_BUCKET}/${newJobId}`;
      return gcsApiService.saveNewJobId(newJobId);
    })
    .then(() => {
      console.log('Successfully increase a new job id by 1.');
      console.log('Initializing a job folder');
      return gcsApiService.initializeJobFolder(voiceSpec);
    })
    .then((initJobFolderRes) => {
      console.log('Successfully initialized the job folder.');
      if (directCopy) {
        console.log('Copying resources to the job folder.');
        return gcsApiService.copyOriginalResources(voiceSpec);
      }
      console.log('Requesting resources from data export module.');
      return dataExporterApiService.createVoice(voiceSpec);
    })
    .then((exportRes) => {
      if (directCopy) {
        console.log('Successfully copied all resources from sources.');
        console.log('Triggering voice building process.');
        return gcsApiService.createTriggerFile(voiceSpec);
      }
      console.log('Successfully start a resource exporting process.');
      return exportRes;
    })
    .then((triggerRes) => {
      if (directCopy) {
        console.log('Successfully triggered voice building.');
      }
      res.status(200).send({ message: 'successfully created a job' });
    })
    .catch((err) => {
      console.error('Failed to create the voice.');
      console.error(err);

      gcsApiService.createVoiceCreationFailedFile(voiceSpec).catch((err) =>{
        console.error('Failed to create a failed file for a voice creation.');
        console.error(err);
      });

      // Returns error message from data exporter,
      // otherwise error from GCS (missing source file or invalid destination bucket)
      // or a static error message.
      const errMsg = (err.response && err.response.data && err.response.data.error.message)
        || err.message.split('\n')[0]
        || 'Failed to create voice due to unkown error';
      res.status(500).send(errMsg);
    });
});

/** POST create a wav resource entry in resource library */
router.post('/create_wav_resource', (req, res) => {
  console.log('Requesting to create a wav resource library...');
  const params = req.body;
  const {
    name, notes, path, lang_id,
  } = params;

  const fileBasePath = utils.createTargetGcsBasePath(lang_id, name);
  const filePath = pathLib.join(fileBasePath, constants.WAV_RESOURCE_FOLDER);

  // TODO(twattanavekin): Remove created_by when we have a better solution
  // to handle a user account on data exporter API.
  const email = constants.TEMP_DEFAULT_EMAIL_ACCOUNT;
  dataExporterApiService.copyResource(path, filePath)
    .then((_createRes) => {
      console.log('Successfully sending a request to data exporter API.');
      // write resource info entry to Datastore
      const data = {
        CreatedBy: email,
        LangId: lang_id,
        Name: name,
        Notes: notes,
        ResourceFolder: fileBasePath,
        OriginalPath: path,
        Path: filePath,
        UploadedTime: new Date().getMilliseconds(),
        SampleRate: 22000,
        Speakers: ['a@somemail.com', 'b@somemail.com'],
        States: ['QC_PASSED', 'QC_FAILED'],
      };
      return datastoreOps.createNewEntry(data, constants.AUDIO_RESOUCE_KIND);
    })
    .then(() => {
      res.status(200).send('success');
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

/** GET all wav resources from DataStore. */
router.get('/get_wav_resources', (req, res) => {
  console.log('Getting all wav resources from DataStore...');
  datastoreOps.getEntries(constants.AUDIO_RESOUCE_KIND)
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

/** GET all wav resources from DataStore. */
router.post('/create_nested_resource', (req, res) => {
  console.log('Creating new nested resources...');
  const params = req.body;
  const {
    parent_id, type, output_format, notes, path,
  } = params;
  datastoreOps.getEntry(constants.AUDIO_RESOUCE_KIND, parent_id)
    .then((result) => {
      const entity = result[0];
      const baseName = pathLib.basename(path);
      const filePath = pathLib.join(entity.ResourceFolder, type, baseName);
      return Promise.all([dataExporterApiService.copyResource(path, filePath), entity, filePath]);
    })
    .then(([_copyResourceRes, entity, filePath]) => {
      console.log('Successfully copied resource.');
      // write resource info entry to Datastore
      // TODO(twattanavekin): Replace hard-coded CreatedBy when we have account
      // management solution.
      const data = {
        CreatedBy: constants.TEMP_DEFAULT_EMAIL_ACCOUNT,
        Format: output_format,
        Notes: notes,
        OriginalPath: path,
        Path: filePath,
        Type: type,
        UploadedTime: new Date().getMilliseconds(),
      };
      return datastoreOps.createNewEntry(data, constants.NESTED_RESOURCE_KIND, entity);
    })
    .then(() => {
      console.log('Successfully stored data.');
      res.status(200).send('success');
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.get('/get_nested_resources/:parentEntityId', (req, res) => {
  const { parentEntityId } = req.params;
  console.log(`Getting nested resources of ${parentEntityId} from DataStore...`);
  datastoreOps.getSubEntries(
    constants.AUDIO_RESOUCE_KIND,
    parentEntityId,
    constants.NESTED_RESOURCE_KIND,
  )
    .then((result) => {
      console.log(result);
      res.status(200).send(result);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

module.exports = router;
