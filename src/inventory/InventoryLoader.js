import { copyInventory } from './Inv.js';
import {
  addInventoryToStore,
  addItemToStore,
  createInventoryStore,
  resetInventoryStore,
} from './InventoryStore.js';
import { copyItem } from './Item.js';

/**
 * @param store
 */
export function loadFromLocalStorage(store) {
  const dataString = localStorage.getItem('satchel_data_v1');
  let jsonData;
  try {
    jsonData = JSON.parse(dataString);
  } catch {
    return;
  }

  if (jsonData && typeof jsonData.data === 'object') {
    loadFromJSON(store, jsonData);
  }
}

/**
 * @param store
 */
export function saveToLocalStorage(store) {
  const jsonData = saveToJSON(store);
  localStorage.removeItem('satchel_data_v1');
  localStorage.setItem('satchel_data_v1', JSON.stringify(jsonData));
}

/**
 * @param store
 * @param jsonData
 */
export function loadFromJSON(store, jsonData) {
  let nextStore = createInventoryStore();
  if (jsonData) {
    if ('data' in jsonData && typeof jsonData.data === 'object') {
      const data = jsonData.data;
      if ('inventory' in data && typeof data.inventory === 'object') {
        const inventories = Object.values(data.inventory);
        for (let inventory of inventories) {
          let newInventory = copyInventory(inventory);
          addInventoryToStore(nextStore, newInventory.invId, newInventory);
        }
      }
      if ('item' in data && typeof data.item === 'object') {
        const items = Object.values(data.item);
        for (let item of items) {
          let newItem = copyItem(item);
          addItemToStore(nextStore, newItem.itemId, newItem);
        }
      }
    }
  }
  resetInventoryStore(store, nextStore);
}

/**
 * @param store
 */
export function saveToJSON(store) {
  const result = {
    data: store.data,
  };
  return result;
}
