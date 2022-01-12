import { exportDataToJSON, importDataFromJSON } from '../satchel/session/SatchelDataLoader.js';
import { cloneItem } from '../satchel/item/Item.js';
import { exportItemToBase64, importItemFromBase64 } from '../satchel/item/ItemBase64.js';

export function importItemFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'item_v1', data => cloneItem(data, dst));
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
  if (!itemString.startsWith('item:')) {
    throw new Error('Invalid item string - missing required prefix.');
  }
  let result = importItemFromBase64(itemString.substring('item:'.length), dst);
  return result;
}
