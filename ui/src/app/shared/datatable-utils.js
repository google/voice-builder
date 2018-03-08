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

/**
 * @fileoverview Common utility and help function to manage Datatable
 * (https://datatables.net) for Resource Library.
 */

/**
 * @typedef {string|number|!Array<string>}
 */
let ValueType;

/**
 * @typedef {!Object<string, !ValueType>}
 */
let EntityType;

/**
 * Flatten JSON structure from Datastore.
 * Datastore always returns primitive results as a pair of value type and value.
 * Example:
 * {
 *   name: {
 *     stringValue: "A",
 *   },
 *   arrival_time: {
 *     timestampValue: "2017-04-20T08:11:35.557Z",
 *   },
 *   speakers: {
 *     arrayValue: {
 *       values: [
 *         {stringValue: "a@somemail.com"},
 *         {stringValue: "b@somemail.com"},
 *       ],
 *     },
 *   }
 * }
 *
 * This function attempts to flatten its structure by removing out value type.
 * It would yield the following result from the above sample:
 * {
 *   name: "A",
 *   arrival_time: "2017-04-20T08:11:35.557Z"
 * }
 *
 *
 * @param {*} obj JSON object to be flatten.
 * @return {*} flatten JSON object.
 */
function flattenJsonStructure(obj) {
  // If it is not object, we don't need to flatten it.
  if (typeof obj !== 'object') {
    return obj;
  }
  for (const key of Object.keys(goog.asserts.assertObject(obj))) {
    if (key === 'arrayValue') {
      // If array, we need to do recursive into its each element object.
      // The actual values we need is always under a key named "values".
      const array = [];
      if (obj[key].values) {
        const allArrayValues = obj[key].values;
        for (const value of allArrayValues) {
          array.push(flattenJsonStructure(value));
        }
      }
      return array;
    } else if (key === 'stringValue') {
      // If stringValue, the value can be just plain text or json string.
      // Thus, we need to check by using JSON.parse().
      // If it can be parsed, it means it has more nested structure that we
      // can flatten more.
      try {
        const oJson = JSON.parse(obj[key]);
        return flattenJsonStructure(oJson);
      } catch (e) {
        return obj[key];
      }
    } else if (key === 'integerValue' || key === 'timestampValue') {
      return obj[key];
    } else {
      obj[key] = flattenJsonStructure(obj[key]);
    }
  }
  return obj;
}

/**
 * Format EntityResults from Datastore to be in the format that DataTable
 * accepts. This function utilizes flattenJsonStructure() to flatten the object
 * and adds "EntityId" as an unique id of the entity as well as "Index" to infer
 * its index in the original input array.
 *
 * Note that "EntityId" is a combination of the entity's id/name and its
 * ancestors' ids/names.
 *
 *
 * @param {!Array<!Object>} entityResults JSON object to be formatted.
 * @return {!Array<!EntityType>} Formatted JSON object which is compatible
 * with DataTable.
 */
function formatEntityResultsForDataTable(entityResults) {
  const results = [];
  for (const [index, result] of entityResults.entries()) {
    // If no entity, we won't do anything.
    // This means it is not an actual entity we need.
    if (!result.entity) {
      continue;
    }
    let flattenResult = {};
    // Check if the content (its properties) is not empty.
    // If no property, we will get just a entity id with empty content.
    if (result.entity.properties) {
      // Deep Clone all the properties into new variables
      flattenResult = JSON.parse(JSON.stringify(result.entity.properties));
      // Flatten its structure
      flattenResult = flattenJsonStructure(flattenResult);
    }
    // Add key id/name to the flatten structure.
    // The entities' paths are utilized as a entity id here.
    // Its original form is an array of its ancestors' ids/names and its
    // ids/names. We combines them together as one.
    //
    // Sample: [{id:'1', kind:'parent'}, {id:'2', kind: 'me'}]
    //
    // Result Key Name: parent-1_me-2
    const entityId = result.entity.key.path.map((path) =>
      `${path.kind}-${path.name || path.id}`).join('_');
    flattenResult.Index = index;
    flattenResult.EntityId = entityId;
    results.push(flattenResult);
  }
  return results;
}
module.exports = {
  flattenJsonStructure,
  formatEntityResultsForDataTable,
  EntityType,
};
