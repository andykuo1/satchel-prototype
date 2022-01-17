import { exportDataToJSON, importDataFromJSON } from './DataLoader.js';
import { cloneItem } from '../satchel/item/Item.js';
import { exportItemToBase64, importItemFromBase64 } from '../satchel/item/ItemBase64.js';

export function importItemFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'item_v1', (data) => cloneItem(data, dst));
}

export function exportItemToJSON(item, dst = undefined) {
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
