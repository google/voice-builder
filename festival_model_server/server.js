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

const api = require('./api');
const bodyParser = require('body-parser');
const compression = require('compression');
const constants = require('./constants');
const cors = require('cors');
const express = require('express');
const modelManager = require('./model_manager');

// constants
const { MODEL_GCS_PATH, NODE_ENV } = process.env;
const PRODUCTION = NODE_ENV === constants.PROD;

const app = express();

app.use(cors());

app.set('port', process.env.PORT || constants.DEFAULT_PORT);
if (PRODUCTION) {
  app.use(compression());
}

// parse application/json
app.use(bodyParser.json());

app.use('/api', api);

// catch 404 and forwarding to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, _next) => {
  res.status(err.status || 500);
  if (!PRODUCTION) {
    // print stack trace for dev environment
    console.trace(err);
    res.json({
      message: err.message,
      error: err,
    });
  } else {
    // no details for production environment
    res.render({
      message: err.message,
      error: {},
    });
  }
});

app.use((err, req, res, _next) => {
  res.status(err.status || 500);
});

/**
 * Generic handler for any promises without rejection handling.
 */
process.on('unhandledRejection', (reason) => {
  console.log(`Reason: ${reason}`);
});

// deploy model before starting a server
modelManager.deployModel(MODEL_GCS_PATH, constants.MODEL_LOCAL_PATH).then((successMsg) => {
  console.log(successMsg);
  app.listen(app.get('port'));
  console.log(`PRODUCTION: ${PRODUCTION}`);
  console.log(`server started on listening port ${app.get('port')}`);
}).catch((err) => {
  console.log(`error to deploy a model: ${err}`);
});

module.exports = app;
