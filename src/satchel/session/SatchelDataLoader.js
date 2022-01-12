export function importDataFromJSON(jsonData, expectedType, dataCallback) {
  if (jsonData._type === expectedType) {
    return dataCallback(jsonData._data, jsonData._metadata);
  } else {
    throw new Error(`Invalid json data format for imported type '${expectedType}'.`);
  }
}

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
