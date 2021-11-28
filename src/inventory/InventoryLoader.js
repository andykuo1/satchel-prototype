import { copyInventory } from './Inv.js';
import { copyItem } from './Item.js';

export function importInventoryFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'inv_v1', data => copyInventory(data, dst));
}

export function exportInventoryToJSON(inv, dst = undefined) {
  return exportDataToJSON('inv_v1', copyInventory(inv), {}, dst);
}

export function importItemFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'item_v1', data => copyItem(data, dst));
}

export function exportItemToJSON(item, dst = undefined) {
  let data = copyItem(item);
  delete data.itemId;
  return exportDataToJSON('item_v1', data, {}, dst);
}

export function importDataFromJSON(jsonData, expectedType, dataCallback) {
  if (jsonData._type === expectedType) {
    return dataCallback(jsonData._data);
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
