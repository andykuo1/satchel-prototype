import {
  copyInventoryStore,
} from './InventoryStore.js';

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
  copyInventoryStore(jsonData, store);
}

/**
 * @param store
 */
export function saveToJSON(store) {
  const result = copyInventoryStore(store);
  return result;
}
