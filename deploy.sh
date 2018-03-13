#!/bin/bash
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

PROJECT_NAME="<PROJECT_NAME>"
PROJECT_NAME_LOWERCASE="${PROJECT_NAME,,}"
PROJECT_ID="<PROJECT_ID>"
GCP_SERVICE_ACCOUNT_EMAIL="<GCP_SERVICE_ACCOUNT_EMAIL>"
DATA_EXPORTER_SERVICE_ACCOUNT="<DATA_EXPORTER_SERVICE_ACCOUNT>"

CONTAINER_REGISTRY="gcr.io/${PROJECT_ID}"
JOB_BUCKET_NAME="${PROJECT_NAME_LOWERCASE}-jobs"
RESOURCE_LIBRARY_BUCKET="${PROJECT_NAME_LOWERCASE}-resource-library"
LOCATION="asia"
ZONE="asia-east1-c"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT_NAME=$(basename "$0")

sub_help(){
  echo "Usage: ${SCRIPT_NAME} <subcommand> [options]"
  echo "Subcommands:"
  echo "    initial_setup           Set up project buckets / permission / pubsub topics"
  echo "    cloud_functions         Deploy cloud functions"
  echo "    ui                      Deploy ui server"
  echo "    acl_for_data_exporter   Give data exporter an acl access to buckets"
  echo "For help with each subcommand run:"
  echo "${SCRIPT_NAME} <subcommand> -h|--help"
  echo ""
}

sub_initial_setup(){
  echo "Initial setup..."
  echo "Setting up a job bucket and a resource library bucket..."
  gsutil mb -l "${LOCATION}" -p "${PROJECT_ID}" \
    -c multi_regional "gs://${JOB_BUCKET_NAME}"
  gsutil mb -l "${LOCATION}" -p "${PROJECT_ID}" \
    -c multi_regional "gs://${RESOURCE_LIBRARY_BUCKET}"
  echo "Setting a job counter (appData/jobCounter.txt) to 0..."
  echo "0" > /tmp/jobCounter.txt && \
    gsutil cp /tmp/jobCounter.txt "gs://${JOB_BUCKET_NAME}/appData/jobCounter.txt"
}

sub_acl_for_data_exporter(){
  echo "Allowing Data Exporter to access the buckets..."
  gsutil acl ch -u "${DATA_EXPORTER_SERVICE_ACCOUNT}:WRITE" "gs://${JOB_BUCKET_NAME}"
  gsutil acl ch -u "${DATA_EXPORTER_SERVICE_ACCOUNT}:WRITE" "gs://${RESOURCE_LIBRARY_BUCKET}"
}

sub_cloud_functions(){
  local temp_folder
  temp_folder="$(mktemp -d)"

  echo "Start deploying cloud_function to ${temp_folder}..."
  cp -af "${DIR}/cloud_functions/." "${temp_folder}"
  copy_config "${temp_folder}/functions/"
  echo "${temp_folder}"
  cd "${temp_folder}/functions" && yarn && cd .. && firebase --project="${PROJECT_ID}" deploy
}

sub_ui(){
  local ui_server_image="${CONTAINER_REGISTRY}/ui:latest"
  local disk_size="50GB"
  local temp_folder
  temp_folder="$(mktemp -d)"

  subsub_create(){
    echo "Deploying ui server to ${temp_folder}..."
    "${DIR}/build_docker.sh" "${CONTAINER_REGISTRY}/ui:latest" "${temp_folder}" "${PROJECT_ID}"
    gcloud beta compute --project="${PROJECT_ID}" \
      instances create-with-container ui \
      --zone="${ZONE}" \
      --container-image="${ui_server_image}" \
      --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/compute,https://www.googleapis.com/auth/compute.readonly" \
      --boot-disk-size="${disk_size}" \
      --tags=https-server
  }

  subsub_update(){
    echo "Clean up unused docker images..."
    gcloud compute --project="${PROJECT_ID}" ssh \
      --zone="${ZONE}" "ui" \
      --command="docker image prune -f -a"
    echo "Updating ui server..."
    "${DIR}/build_docker.sh" "${CONTAINER_REGISTRY}/ui:latest" "${temp_folder}" "${PROJECT_ID}"
    gcloud beta compute --project="${PROJECT_ID}" \
      instances update-container ui \
      --zone="${ZONE}" \
      --container-image="${ui_server_image}"
  }

  subsubcommand=$1; shift

  cp -af "${DIR}/ui/." "${temp_folder}"
  copy_config "${temp_folder}/backend/"

  "subsub_$subsubcommand" "$@"
  if [ $? = 127 ]; then
    echo "Please specify subcommand for ui deployment."
    exit 1
  fi
}

copy_config(){
  local temp_folder="$1"
  local temp_config
  temp_config="$(mktemp)"

  sed "s/<PROJECT_ID>/${PROJECT_ID}/g" "${DIR}/config.js" |
  sed "s/<JOB_BUCKET_NAME>/${JOB_BUCKET_NAME}/g" |
  sed "s/<GCP_SERVICE_ACCOUNT_EMAIL>/${GCP_SERVICE_ACCOUNT_EMAIL}/g" |
    sed "s/<ZONE>/${ZONE}/g" > "${temp_config}"

  cp "${temp_config}" "${temp_folder}/config.js"
}

subcommand=$1; shift # Remove $subcommand from the argument list
case "$subcommand" in
  "" | "-h" | "--help")
    sub_help
    ;;
  *)
    "sub_${subcommand}" "$@"
    if [ $? = 127 ]; then
      echo "Error: '$subcommand' is not a known subcommand." >&2
      echo "       Run '${SCRIPT_NAME} --help' for a list of known subcommands." >&2
      exit 1
    fi
    ;;
esac
