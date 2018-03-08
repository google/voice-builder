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

const Datastore = require('@google-cloud/datastore');
const config = require('./config');

/**
 * Module containing all the basic datastore operations.
 */

// Instantiates a client
const datastore = Datastore({
  projectId: config.PROJECT_ID,
});

const DatastoreOps = {
  createNewEntry: (data, kind, parent) => {
    let taskKey;
    if (parent === undefined) {
      taskKey = datastore.key(kind);
    } else {
      const parentKey = parent[datastore.KEY];
      taskKey = datastore.key([parentKey.kind, parseInt(parentKey.id, 10), kind]);
    }

    const entity = {
      key: taskKey,
      data,
    };
    return datastore.upsert(entity);
  },

  getEntries: (kind) => {
    const query = datastore.createQuery(kind);
    return datastore.runQuery(query)
      .then((result) => result[0].map((entry) =>
        Object.assign(entry, { EntityId: entry[datastore.KEY].id })));
  },

  getSubEntries: (parentKind, parentId, kind) => {
    const key = datastore.key([parentKind, parseInt(parentId, 10)]);
    const query = datastore.createQuery(kind).hasAncestor(key);
    return datastore.runQuery(query);
  },

  getEntry: (kind, id) => {
    const key = datastore.key([kind, parseInt(id, 10)]);
    return datastore.get(key);
  },
};

module.exports = DatastoreOps;
