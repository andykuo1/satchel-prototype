import { createGridInventory, createSocketInventory } from './Inv.js';

/**
 * @typedef {import('./Inv.js').InventoryId} InventoryId
 * @typedef {import('./Inv.js').InventoryType} InventoryType
 * @typedef {import('./Inv.js').Inventory} Inventory
 * @typedef {import('./Item.js').ItemId} ItemId
 * @typedef {import('./Item.js').Item} Item
 */

/************************************************** STORE */

/**
 * @typedef {object} InventoryStore
 */

let GLOBAL_STORE = createInventoryStore();

export function createInventoryStore() {
  return {
    data: {
      item: {},
      inventory: {},
    },
    listeners: {
      item: {},
      inventory: {},
      container: {},
    },
  };
}

/**
 * @param store
 */
export function setInventoryStore(store) {
  GLOBAL_STORE = store;
}

/**
 * @param previousStore
 * @param nextStore
 */
export function resetInventoryStore(previousStore, nextStore) {
  const previousItemList = Object.keys(previousStore.data.item);
  const previousInventoryList = Object.keys(previousStore.data.inventory);
  const nextItemList = Object.keys(nextStore.data.item);
  const nextInventoryList = Object.keys(nextStore.data.inventory);
  // Copy data over
  previousStore.data.item = { ...nextStore.data.item };
  previousStore.data.inventory = { ...nextStore.data.inventory };

  // Dispatch all events
  dispatchInventoryListChange(previousStore);
  const visitedItems = new Set();
  const visitedInventories = new Set();
  // Dispatch for old objects
  for (const itemId of previousItemList) {
    visitedItems.add(itemId);
    dispatchItemChange(previousStore, itemId);
  }
  for (const invId of previousInventoryList) {
    visitedInventories.add(invId);
    dispatchInventoryChange(previousStore, invId);
  }
  // Dispatch for new objects
  for (const itemId of nextItemList) {
    if (!visitedItems.has(itemId)) {
      dispatchItemChange(previousStore, itemId);
    }
  }
  for (const inventoryId of nextInventoryList) {
    if (!visitedInventories.has(inventoryId)) {
      dispatchInventoryChange(previousStore, inventoryId);
    }
  }
}

export function getInventoryStore() {
  return GLOBAL_STORE;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 */
export function isInventoryInStore(store, invId) {
  return invId in store.data.inventory;
}

/**
 *
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 */
export function getInventoryInStore(store, invId) {
  return store.data.inventory[invId];
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param {Inventory} inventory
 */
export function addInventoryToStore(store, invId, inventory) {
  if (invId !== inventory.invId) {
    throw new Error(`Cannot add inventory '${inventory.invId}' for mismatched id '${invId}'.`);
  }
  if (invId in store.data.inventory) {
    return false;
  }
  store.data.inventory[invId] = inventory;
  dispatchInventoryListChange(store);
  dispatchInventoryChange(store, invId);
  return true;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param {Inventory} inventory
 */
export function deleteInventoryFromStore(store, invId, inventory) {
  if (invId !== inventory.invId) {
    throw new Error(`Cannot delete inventory '${inventory.invId}' for mismatched id '${invId}'.`);
  }
  if (!(invId in store.data.inventory)) {
    return false;
  }
  delete store.data.inventory[invId];
  dispatchInventoryListChange(store);
  dispatchInventoryChange(store, invId);
  return true;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @param {number} width
 * @param {number} height
 * @returns {Inventory}
 */
export function createGridInventoryInStore(store, invId, width, height) {
  let inv = createGridInventory(invId, width, height);
  if (!addInventoryToStore(store, invId, inv)) {
    throw new Error('Failed to create socket inventory in store.');
  }
  return inv;
}

/**
 * @param {InventoryStore} store
 * @param {InventoryId} invId
 * @returns {Inventory}
 */
export function createSocketInventoryInStore(store, invId) {
  let inv = createSocketInventory(invId);
  if (!addInventoryToStore(store, invId, inv)) {
    throw new Error('Failed to create socket inventory in store.');
  }
  return inv;
}

/**
 * @param store
 * @param inventoryId
 */
export function getInventory(store, inventoryId) {
  if (isInventoryInStore(store, inventoryId)) {
    return getInventoryInStore(store, inventoryId);
  } else {
    return null;
  }
}

/**
 * @param store
 * @param inventoryId
 */
export function dispatchInventoryChange(store, inventoryId) {
  dispatchInventoryEvent(store, 'inventory', inventoryId);
}

/**
 * @param store
 * @param inventoryId
 * @param callback
 */
export function addInventoryChangeListener(store, inventoryId, callback) {
  addInventoryEventListener(store, 'inventory', inventoryId, callback);
}

/**
 * @param store
 * @param inventoryId
 * @param callback
 */
export function removeInventoryChangeListener(store, inventoryId, callback) {
  removeInventoryEventListener(store, 'inventory', inventoryId, callback);
}

/**
 * @param store
 */
export function dispatchInventoryListChange(store) {
  dispatchInventoryEvent(store, 'container', 'all');
}

/**
 * @param store
 * @param callback
 */
export function addInventoryListChangeListener(store, callback) {
  addInventoryEventListener(store, 'container', 'all', callback);
}

/**
 * @param store
 * @param callback
 */
export function removeInventoryListChangeListener(store, callback) {
  removeInventoryEventListener(store, 'container', 'all', callback);
}

/**
 * @param store
 */
export function getInventoryList(store) {
  return Object.values(store.data.inventory);
}

/************************************************** INVENTORY */

/**
 * @param {InventoryStore} store
 * @param {ItemId} itemId
 * @returns {boolean}
 */
export function isItemInStore(store, itemId) {
  return itemId in store.data.item;
}

/**
 * @param {InventoryStore} store
 * @param {ItemId} itemId
 * @returns {Item}
 */
export function getItemInStore(store, itemId) {
  return store.data.item[itemId];
}

/**
 * @param {InventoryStore} store
 * @param {ItemId} itemId
 * @param {Item} item
 * @returns {boolean}
 */
export function addItemToStore(store, itemId, item) {
  if (itemId !== item.itemId) {
    throw new Error(`Cannot add item '${item.itemId}' for mismatched id '${itemId}'.`);
  }
  if (itemId in store.data.item) {
    return false;
  }
  store.data.item[itemId] = item;
  return true;
}

/**
 * @param {InventoryStore} store
 * @param {ItemId} itemId
 * @param {Item} item
 * @returns {boolean}
 */
export function deleteItemFromStore(store, itemId, item) {
  if (itemId !== item.itemId) {
    throw new Error(`Cannot delete item '${item.itemId}' for mismatched id '${itemId}'.`);
  }
  if (!(itemId in store.data.item)) {
    return false;
  }
  delete store.data.item[itemId];
  return true;
}

/**
 * @param store
 */
export function getItems(store) {
  return Object.values(store.data.item);
}

/**
 * @param store
 * @param itemId
 * @param state
 */
export function updateItem(store, itemId, state) {
  const item = store.data.item[itemId];
  if (!item) {
    throw new Error('Cannot update null item.');
  }

  store.data.item[itemId] = {
    ...item,
    ...state,
  };
  dispatchItemChange(store, itemId);
}

/**
 * @param store
 * @param itemId
 */
export function dispatchItemChange(store, itemId) {
  dispatchInventoryEvent(store, 'item', itemId);
}

/**
 * @param store
 * @param itemId
 * @param callback
 */
export function addItemChangeListener(store, itemId, callback) {
  addInventoryEventListener(store, 'item', itemId, callback);
}

/**
 * @param store
 * @param itemId
 * @param callback
 */
export function removeItemChangeListener(store, itemId, callback) {
  removeInventoryEventListener(store, 'item', itemId, callback);
}

/**
 * @param store
 * @param event
 * @param key
 * @param callback
 */
function addInventoryEventListener(store, event, key, callback) {
  if (!(event in store.listeners)) {
    throw new Error(`Cannot manage listener for unknown inventory event '${event}'.`);
  }

  let listeners = store.listeners[event][key];
  if (!listeners) {
    listeners = [];
    store.listeners[event][key] = listeners;
  }

  listeners.push(callback);
}

/**
 * @param store
 * @param event
 * @param key
 * @param callback
 */
function removeInventoryEventListener(store, event, key, callback) {
  if (!(event in store.listeners)) {
    throw new Error(`Cannot manage listener for unknown inventory event '${event}'.`);
  }

  const listeners = store.listeners[event][key];
  if (listeners) {
    const i = listeners.indexOf(callback);
    if (i >= 0) {
      listeners.splice(i, 1);
    }
  }
}

/**
 * @param store
 * @param event
 * @param key
 */
function dispatchInventoryEvent(store, event, key) {
  if (!(event in store.listeners)) {
    throw new Error(`Cannot dispatch event for unknown inventory event '${event}'.`);
  }

  const listeners = store.listeners[event][key];
  if (listeners) {
    for (const listener of listeners) {
      listener.call(undefined, store, key);
    }
  }
}
