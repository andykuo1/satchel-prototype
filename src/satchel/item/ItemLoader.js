import { exportDataToJSON, importDataFromJSON } from '../../session/SatchelDataLoader.js';
import { cloneItem } from './Item.js';

export function importItemFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'item_v1', data => cloneItem(data, dst));
}

export function exportItemToJSON(item, dst = undefined) {
  let data = cloneItem(item);
  delete data.itemId;
  return exportDataToJSON('item_v1', data, {}, dst);
}
