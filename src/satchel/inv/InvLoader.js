import { exportDataToJSON, importDataFromJSON } from '../../session/SatchelDataLoader.js';
import { cloneInventory } from './Inv.js';

export function importInventoryFromJSON(jsonData, dst = undefined) {
  return importDataFromJSON(jsonData, 'inv_v1', data => cloneInventory(data, dst));
}

export function exportInventoryToJSON(inv, dst = undefined) {
  return exportDataToJSON('inv_v1', cloneInventory(inv), {}, dst);
}
