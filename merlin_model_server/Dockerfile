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

# This docker image has language-resources, festival and merlin install.
FROM langtech/base-merlin:v1

# Nodejs version to install
ENV NODEJS_VERSION="v8.9.3"

# Install Nodejs
WORKDIR /opt/
RUN wget http://storage.googleapis.com/gae_node_packages/node-${NODEJS_VERSION}-linux-x64.tar.gz \
      && tar -xf node-${NODEJS_VERSION}-linux-x64.tar.gz \
      && rm node-${NODEJS_VERSION}-linux-x64.tar.gz

ENV PATH $PATH:/opt/node-${NODEJS_VERSION}-linux-x64/bin
ENV NODE_ENV production

# Install yarn
RUN mkdir -p /opt/yarn && curl -L https://yarnpkg.com/latest.tar.gz | tar xvzf - -C /opt/yarn --strip-components=1
ENV PATH $PATH:/opt/yarn/bin

WORKDIR /usr/local/src/

# Env path to the merlin synthesizer bash script.
ENV SYNTH_SCRIPT /usr/local/src/language-resources/festival_utils/docker_synth.sh

# Create app directory
WORKDIR /app

# Install necessary modules
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

ENV PORT 80
ENV NODE_ENV production
EXPOSE 80

CMD node server.js
