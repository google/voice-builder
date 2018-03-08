# Copyright 2018 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Dockerfile extending the generic Node image with application files for a
# single application.
FROM gcr.io/google_appengine/nodejs
# Check to see if the the version included in the base runtime satisfies
# '>=0.12.7', if not then do an npm install of the latest available
# version that satisfies it.
RUN /usr/local/bin/install_node '>=v8.6.0'

# Create app directory
WORKDIR /app

# Install necessary modules and also minify the frontend js.
ENV NODE_ENV development
COPY package.json /app
# You have to specify "--unsafe-perm" with npm install
# when running as root.  Failing to do this can cause
# install to appear to succeed even if a preinstall
# script fails, and may have other adverse consequences
# as well.
# This command will also cat the npm-debug.log file after the
# build, if it exists.
RUN yarn --unsafe-perm || \
  ((if [ -f npm-debug.log ]; then \
      cat npm-debug.log; \
    fi) && false)
COPY . /app
RUN yarn build

# This application will work only in GCP platform because it requires Application Credentials Default (ADC)
# Please refer to https://cloud.google.com/docs/authentication/production
#
# To make it work for another platform (e.g. local docker run),
# You can get a new application default credential:
# 1. In Pantheon, go to the service account page, looks for "App Engine app default service account"
# 2. Click create and download the credentials in JSON format.
# 3. Name it "credentials.json" and put in the same folder with this Dockerfile.
# 4. Uncomment following commands and rebuild the image to include credentials file in your docker image.
# RUN mkdir -p /etc/google/auth
# COPY credentials.json /etc/google/auth/application_default_credentials.json
# ENV GOOGLE_APPLICATION_CREDENTIALS /etc/google/auth/application_default_credentials.json

# Setup production env
ENV PORT 3389
ENV NODE_ENV production

EXPOSE 3389

CMD ["node", "server.js"]
