/**
 * @typedef ImportDataFormat
 * @property {string} [_type]
 * @property {object} [_data]
 * @property {object} [_metadata]
 * @property {number} [_metadata.timestamp]
 */

/**
 * @param {ImportDataFormat} jsonData 
 * @param {string} expectedType 
 * @param {(data: object, metadata: object) => any} dataCallback
 * @returns {any}
 */
export function importDataFromJSON(jsonData, expectedType, dataCallback) {
  if (jsonData._type === expectedType) {
    return dataCallback(jsonData._data, jsonData._metadata);
  } else {
    throw new Error(`Invalid json data format for imported type '${expectedType}'.`);
  }
}

/**
 * @param {string} type 
 * @param {object} data 
 * @param {object} metadata 
 * @param {object} [dst]
 * @returns {ImportDataFormat}
 */
export function exportDataToJSON(type, data, metadata, dst = undefined) {
  if (!dst) {
    dst = {};
  }
  dst._type = type;
  dst._data = data;
  dst._metadata = {
    timestamp: Date.now(),
    ...metadata,
  };
  return dst;
}
