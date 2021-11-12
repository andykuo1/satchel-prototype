import { getInventory, resetInventoryStore } from './InventoryStore.js';
import { getInventoryItems } from './InventoryTransfer.js';

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
  const nextStore = {
    data: {
      item: jsonData.data.item,
      inventory: jsonData.data.inventory,
    },
  };
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

/**
 * @param store
 * @param inventoryName
 */
export function saveInventoryToJSON(store, inventoryName) {
  const inv = getInventory(store, inventoryName);
  const result = {
    data: {
      item: {},
      inventory: {
        [inventoryName]: inv,
      },
    },
  };
  const items = getInventoryItems(store, inventoryName);
  for (const item of items) {
    result.data.item[item.itemId] = item;
  }

  return result;
}
