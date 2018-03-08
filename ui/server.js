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

const api = require('./backend/api');
const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const fs = require('fs');
const google = require('googleapis');
const morgan = require('morgan');
const path = require('path');
const util = require('util');
const webpack = require('webpack');
const webpackDevConfig = require('./webpack.dev');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const constants = require('./backend/constants');

// constants
const app = express();
const DIST_DIR = path.join(__dirname, constants.DIST_DIR);
const PRODUCTION = process.env.NODE_ENV === constants.PROD;

// Create a write stream for an access log file.
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'), { flags: 'a' });

// Pipe debug log to file
const debugLogStream = fs.createWriteStream(
  path.join(__dirname, 'debug.log'), { flags: 'w' });

// Override console log to also pipe to log file
console.log = (msg) => {
  debugLogStream.write(`${util.format(msg)}\n`);
  process.stdout.write(`${util.format(msg)}\n`);
};

// Declare global variable for google api.
google.auth.getApplicationDefault((err, authClient, _projectId) => {
  if (err) {
    throw err;
  }
  if (authClient.createScopedRequired && authClient.createScopedRequired()) {
    console.log('Assigning a cloud-platform scope.');
    // eslint-disable-next-line no-param-reassign
    authClient = authClient.createScoped(constants.GCP_SCOPE);
  }
  console.log('Successfully authenticated Google Application Default...');
  // Make genomics a global var (no "let" or "const" declaration).
  global.genomics = google.genomics({
    version: 'v1alpha2',
    auth: authClient,
  });

  global.authClient = authClient;
});

app.set('port', process.env.PORT || constants.DEFAULT_PORT);

if (PRODUCTION) {
  app.use(express.static(DIST_DIR));
  app.use(compression());
} else {
  const compiler = webpack(webpackDevConfig);
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackDevConfig.output.publicPath,
  }));
  app.use(webpackHotMiddleware(compiler));
}

// parse application/json
app.use(bodyParser.json());

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

// Expose templates to frontend
app.use('/templates', express.static(path.join(__dirname, 'templates')));

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

app.listen(app.get('port'));
console.log(`PRODUCTION: ${PRODUCTION}`);
console.log(`server started on listening port ${app.get('port')}`);
module.exports = app;
