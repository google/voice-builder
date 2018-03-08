#!/bin/bash -ex
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

# Script to build docker image and push to GCP
# ./build_docker.sh <TARGET_IMAGE_NAME> <DIRECTORY_OF_DOCKERFILE>

if [ $# -ne 3 ]; then
  echo "Usage: ./build_docker.sh <TARGET_IMAGE_NAME> <DIRECTORY_OF_DOCKERFILE> <PROJECT_ID>"
  exit 1
fi

IMAGE=$1
DIR=$2
PROJECT_ID=$3
DOCKER_CMD="docker build --no-cache -t $IMAGE $DIR"
TIMESTAMP=$(date +%s)
echo "timestamp: $TIMESTAMP"

# Build a new image
echo "running: $DOCKER_CMD"
eval "${DOCKER_CMD}"

gcloud docker --project="${PROJECT_ID}" -- push "$IMAGE"
