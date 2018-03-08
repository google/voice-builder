<b>Disclaimer:</b> This is not an official Google product.

# Voice Builder

Voice Builder is an opensource text-to-speech (TTS) voice building tool that
focuses on simplicity, flexibility, and collaboration. Our
tool allows anyone with basic computer skills to run voice training experiments
and listen to the resulting synthesized voice.

We hope that this tool will reduce the barrier for creating new voices and
accelerate TTS research, by making experimentation faster and
interdisciplinary collaboration easier. We believe that our tool can help
improve TTS research, especially for low-resourced languages,
where more experimentations are often needed to get the most out of the limited
data.

## Installation

### Prerequisites

1. Create a project on GCP

2. Enable billing and request more quota for your project

3. Go to Firebase.com and import the project to firebase platform

4. Install gcloud cmd line tool by installing [Cloud
   SDK](https://cloud.google.com/sdk/downloads)

5. Install [firebase cmd line tool](https://github.com/firebase/firebase-tools)

6. [Optional] Setup your own data exporter

7. Enable all the following GCP services:

  - Appengine API
  - Firebase Cloud Function
  - Genomics Pipeline API

  Use [this url](https://console.cloud.google.com/flows/enableapi?apiid=genomics,storage_component,storage_api,compute_component,containerregistry.googleapis.com) to enable them all at once.

### Deployment

1. Open /deploy.sh and edit the following variables:

  - PROJECT_NAME: your created GCP project's name from Prerequisite 1) e.g. vb-test-project
  - PROJECT_ID: your created GCP project's id from Prerequisite 1) e.g. vb-test-project
  - GCP_SERVICE_ACCOUNT_EMAIL: Use Compute Engine service account (you can find
    one under GCP service account page) e.g.
    123456778911-compute@developer.gserviceaccount.com

2. Create GCS buckets for Voice Builder to store each job data

  ```
  ./deploy.sh initial_setup
  ```

3. Deploy cloud functions component

  ```
  ./deploy.sh cloud_functions
  ```

4. Deploy ui component

  ```
  ./deploy.sh ui create
  ```
  After the deployment, you should get an IP that you can access from command
  line's result (EXTERNAL_IP). You can access your instance of Voice Builder
  by visiting http://EXTERNAL_IP:3389 in
  your browser.

5. Create an example voice using Festival engine

  At this step, you should have all components in place and can access the UI
  at http://EXTERNAL_IP:3389. VoiceBuilder initially provides you with two
  example TTS engines ([Festival](http://www.cstr.ed.ac.uk/projects/festival/)
  and [Merlin](http://www.cstr.ed.ac.uk/projects/merlin/)) and public data
  from [language resources repo](https://github.com/googlei18n/language-resources).

  You can test if everything is now working correctly by creating a new voice
  yourself using our provided Festival engine by:
  1. Access http://EXTERNAL_IP:3389 and go to a create-voice form by clicking
    "CREATE VOICE" tab on top.
  2. You will see a form where you can choose different TTS engines and input
    data for your voice. Just skim through as we will use this initial config
    for building a new voice. Try clicking "Create Voice" button at the bottom.
    After a short moment, you should get a notification on the top right saying
    "successfully created a job".
  3. Click on "JOBS" tab. Now, you should see a new job that you have just
    created. It usually takes 30mins to 1 hour to run. You can check the status
    of the job by clicking on the job id to see the job status page.
  4. After an hour, you should see "Complete Voice Model Deployment" under
    the job status. This means the succesfully built model has been deployed
    to a voice synthesis server. Try putting in "hello" in the text input box
    at the bottom of the job status page and click "Synthesize" button.
    Voice Builder should generate a spectrogram and have a play button for you
    to listen to the voice!


### (Optional) Using Custom Data Exporter
Data Exporter is another additional component you can add to the system.
Normally, Voice Builder can work without Data Exporter. Without it,
Voice Builder would just use the input files as they are.

However, in some cases you want to apply some conversion to your input files
before feeding them into TTS algorithms. For example:

  * You have lexicon file that is in a different format from the one accepted
    by your chosen TTS algorithm.
  * You want to filter out some bad data before using it in your chosen TTS algorithm.

Voice Builder gives you the flexibility to add your own data exporter which you
can use to manipulate data before running the actual TTS algorithm. Your custom
data exporter will get a Voice Specification containing file location, chosen
TTS algorithm, tuning parameters, etc. You can use these information to
manipulate/convert your data. In the end, your data exporter should put all
necessary files into the designated job folder to trigger the actual TTS algorithm to run.

Firstly, you need to give your data exporter access to GCS buckets.

1. Open /deploy.sh and edit the following variables:

  - DATA_EXPORTER_SERVICE_ACCOUNT: getting it by creating a new service
    account for your data exporter to access GCS buckets.

2. Run command to give DATA_EXPORTER_SERVICE_ACCOUNT an ACL access to GCS buckets

  ```
  ./deploy.sh acl_for_data_exporter
  ```

Secondly, you need to set your data exporter's url in config.js so that
Voice Builder knows where to send Voice Specification information to.

1. Open /config.js and add DATA_EXPORTER_API to the config as follows:

  ```
  DATA_EXPORTER_API: {
    BASE_URL: '<DATA_EXPORTER_URL>',
    API_KEY: '<DATA_EXPORTER_API_KEY>',
  }
  ```
  where BASE_URL is your data exporter url and API_KEY is the api key of your data exporter.

2. Redeploy Voice Builder UI instance so that it now has a new config and knows
  where to send Voice Specification info. to your data exporter

  ```
  ./deploy.sh ui update
  ```

3. Try to create a new job! Voice Builder should now send a request to your DATA_EXPORTER_URL with the created job's Voice Specification.
