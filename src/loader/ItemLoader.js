import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';
import { cloneItem, createItem } from '../satchel/item/Item.js';
import { exportItemToBase64, importItemFromBase64 } from '../satchel/item/ItemBase64.js';

export function importItemFromJSON(jsonData, dst = undefined) {
  switch(jsonData._type) {
    case 'item_v1':
      return importDataFromJSON(jsonData, 'item_v1', (data) => cloneItem(data, dst));
    case 'item_v2':
    default:
      return importDataFromJSON(jsonData, 'item_v2', (data) => {
        data = decompressItemJson(data);
        return cloneItem(data, dst);
      });
  }
}

export function exportItemToJSON(item, dst = undefined) {
  /** @type {object} */
  let data = cloneItem(item);
  delete data.itemId;
  data = compressItemJson(data);
  return exportDataToJSON('item_v2', data, {}, dst);
}

export function exportItemV1ToJSON(item, dst = undefined) {
  /** @type {object} */
  let data = cloneItem(item);
  delete data.itemId;
  return exportDataToJSON('item_v1', data, {}, dst);
}

export function exportItemToString(item) {
  let dataString = exportItemToBase64(item);
  return `item:${dataString}`;
}

export function importItemFromString(itemString, dst = undefined) {
  let i = itemString.indexOf('item:');
  if (i < 0) {
    throw new Error(`Invalid item string - missing required prefix 'item'`);
  }
  let j = itemString.indexOf(/\s+/, i);
  let k = i + 'item:'.length;
  let base64String = j < 0 ? itemString.substring(k) : itemString.substring(k, j);
  let result = importItemFromBase64(base64String, dst);
  return result;
}

export function compressItemJson(uncompressedJson) {
  let newItem = createItem('');
  let result = [];
  for(let key of Object.keys(newItem)) {
    if (key === 'itemId') continue;
    let value = uncompressedJson[key];
    result.push(value);
  }
  return result;
}

export function decompressItemJson(compressedJson) {
  let newItem = createItem('');
  let result = {};
  let i = 0;
  for(let key of Object.keys(newItem)) {
    if (key === 'itemId') continue;
    let value = compressedJson[i];
    result[key] = value;
    ++i;
  }
  return result;
}
